import { User } from "../models/userSchema.js";
import { PaymentProof } from "../models/commissionProofSchema.js";
import { Commission } from "../models/commissionSchema.js";
import cron from "node-cron";
import { sendEmail } from "../utils/sendEmail.js";

export const verifyCommissionCron = () => {
  cron.schedule("*/1 * * * *", async () => {
    console.log("Running Verify Commission Cron...");

    try {
      const approvedProofs = await PaymentProof.find({ status: "Approved" });
      console.log(`Found ${approvedProofs.length} approved payment proofs.`);

      for (const proof of approvedProofs) {
        try {
          const user = await User.findById(proof.userId);
          if (!user) {
            console.log(`User not found for proof ID: ${proof._id}`);
            continue; // Skip to next proof
          }     

          console.log(`User found: ${user.userName}, Email: ${user.email}`);

          let updatedUserData = {};
          if (user.unpaidCommission >= proof.amount) {
            updatedUserData = await User.findByIdAndUpdate(
              user._id,
              {
                $inc: {
                  unpaidCommission: -proof.amount,
                },
              },
              { new: true }
            );
            await PaymentProof.findByIdAndUpdate(proof._id, {
              status: "Settled",
            });
            console.log(`Commission settled for user ${user._id}.`);
          } else {
            updatedUserData = await User.findByIdAndUpdate(
              user._id,
              {
                unpaidCommission: 0,
              },
              { new: true }
            );
            await PaymentProof.findByIdAndUpdate(proof._id, {
              status: "Settled",
            });
            console.log(`User ${user._id} had less unpaid commission than proof amount.`);
          }

          await Commission.create({
            amount: proof.amount,
            user: user._id,
          });

          const settlementDate = new Date(Date.now()).toString().substring(0, 15);

          const subject = `Your Payment Has Been Successfully Verified And Settled`;
          const message = `Dear ${user.userName},\n\nWe are pleased to inform you that your recent payment has been successfully verified and settled. Thank you for promptly providing the necessary proof of payment. Your account has been updated, and you can now proceed with your activities on our platform without any restrictions.\n\nPayment Details:\nAmount Settled: ${proof.amount}\nUnpaid Amount: ${updatedUserData.unpaidCommission}\nDate of Settlement: ${settlementDate}\n\nBest regards,\nSnapBid Team`;

          console.log(`Attempting to send email to user ${user._id}...`);
          await sendEmail({ email: user.email, subject, message });
          console.log(`Email successfully sent to user ${user._id}`);

        } catch (error) {
          console.error(`Error processing commission proof for user ${proof.userId}: ${error.message}`);
        }
      }
    } catch (error) {
      console.error(`Error in verify commission cron: ${error.message}`);
    }
  });
};
