import cron from "node-cron";
import { Auction } from "../models/auctionSchema.js";
import { User } from "../models/userSchema.js";
import { Bid } from "../models/bidSchema.js";
import { sendEmail } from "../utils/sendEmail.js";
import { calculateCommission } from "../controllers/commissionController.js";

export const endedAuctionCron = () => {
  cron.schedule("*/1 * * * *", async () => {
    const now = new Date();
    console.log("Cron for ended auction running...");
    
    // Log the current time (for debugging purposes)
    console.log(`Current time: ${now}`);

    try {
      const endedAuctions = await Auction.find({
        endTime: { $lt: now },
        commissionCalculated: false,
      });

      // Log the number of auctions that have ended
      console.log(`Found ${endedAuctions.length} auctions that have ended.`);

      // Log each auction's endTime to see if they are correctly being fetched
      endedAuctions.forEach(auction => {
        console.log(`Auction endTime: ${auction.endTime}`);
      });

      for (const auction of endedAuctions) {
        try {
          const commissionAmount = await calculateCommission(auction._id);
          console.log(`Commission for auction ${auction._id}: ${commissionAmount}`);

          auction.commissionCalculated = true;

          const highestBidder = await Bid.findOne({
            auctionItem: auction._id,
            amount: auction.currentBid,
          });

          if (!highestBidder) {
            console.log(`No highest bidder found for auction ${auction._id}.`);
            continue; // Move to the next auction
          }

          console.log(`Highest bidder for auction ${auction._id}: ${highestBidder.bidder.id}`);

          const auctioneer = await User.findById(auction.createdBy);
          if (!auctioneer) {
            console.log(`Auctioneer not found for auction ${auction._id}`);
            continue;
          }

          console.log(`Auctioneer for auction ${auction._id}: ${auctioneer.userName}, Email: ${auctioneer.email}`);

          auctioneer.unpaidCommission = commissionAmount;
          auction.highestBidder = highestBidder.bidder.id;
          await auction.save();

          const bidder = await User.findById(highestBidder.bidder.id);
          if (!bidder) {
            console.log(`Bidder not found for ID: ${highestBidder.bidder.id}`);
            continue;
          }

          // Insert the bid debugging line here to log the bids associated with the auction
          const bidsForAuction = await Bid.find({ auctionItem: auction._id });
          console.log(`Bids for auction ${auction._id}:`, bidsForAuction);

          await User.findByIdAndUpdate(
            bidder._id,
            {
              $inc: {
                moneySpent: highestBidder.amount,
                auctionsWon: 1,
              },
            },
            { new: true }
          );

          await User.findByIdAndUpdate(
            auctioneer._id,
            {
              $inc: {
                unpaidCommission: commissionAmount,
              },
            },
            { new: true }
          );

          const subject = `Congratulations! You won the auction for ${auction.title}`;
          const message = `Dear ${bidder.userName}, \n\nCongratulations! You have won the auction for ${auction.title}.\n\nBefore proceeding for payment contact your auctioneer via your auctioneer email:${auctioneer.email} \n\nPlease complete your payment using one of the following methods:\n\n1. **Bank Transfer**: \n- Account Name: ${auctioneer.paymentMethods.bankTransfer.bankAccountName} \n- Account Number: ${auctioneer.paymentMethods.bankTransfer.bankAccountNumber} \n- Bank: ${auctioneer.paymentMethods.bankTransfer.bankName}\n\n2. **GooglePay**:\n- You can send payment via GooglePay: ${auctioneer.paymentMethods.gpay.gpayPhoneNumber}\n\n3. **PayPal**:\n- Send payment to: ${auctioneer.paymentMethods.paypal.paypalEmail}\n\n4. **Cash on Delivery (COD)**:\n- If you prefer COD, you must pay 20% of the total amount upfront before delivery.\n- To pay the 20% upfront, use any of the above methods.\n- The remaining 80% will be paid upon delivery.\n- If you want to see the condition of your auction item then send your email on this: ${auctioneer.email}\n\nPlease ensure your payment is completed by [Payment Due Date]. Once we confirm the payment, the item will be shipped to you.\n\nThank you for participating!\n\nBest regards,\nSnapBid Team`;

          console.log("Attempting to send email to highest bidder...");
          await sendEmail({ email: bidder.email, subject, message });
          console.log("Email successfully sent to highest bidder.");

        } catch (error) {
          console.error(`Error processing auction ${auction._id}: ${error.message}`);
        }
      }
    } catch (error) {
      console.error(`Error in ended auction cron: ${error.message}`);
    }
  });
};
