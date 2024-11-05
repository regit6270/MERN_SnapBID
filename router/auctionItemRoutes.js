import {
    addNewAuctionItem,
    getAllItems,
    getAuctionDetails,
    getMyAuctionItems,
    removeFromAuction,
    republishItem, 
    getLiveAuctionsByCategory
  } from "../controllers/auctionItemController.js";
  import { isAuthenticated, isAuthorized } from "../middlewares/auth.js";
  import express from "express";
  import { trackCommissionStatus } from "../middlewares/trackCommissionStatus.js";

  const router = express.Router();

  router.post(
    "/create",
    isAuthenticated,
    isAuthorized("Auctioneer"),
    trackCommissionStatus,
    addNewAuctionItem
  );
  
  router.get("/allitems", getAllItems);

  // Add the new route to fetch live auctions by category
  router.get('/live', getLiveAuctionsByCategory);
  
  router.get("/auction/:id", isAuthenticated, getAuctionDetails);
  
  router.get(
    "/myitems",
    isAuthenticated,
    isAuthorized("Auctioneer"),
    getMyAuctionItems
  );
  
  router.delete(
    "/delete/:id",
    isAuthenticated,
    isAuthorized("Auctioneer"),
    removeFromAuction
  );
  
  router.put(
    "/item/republish/:id",
    isAuthenticated,
    isAuthorized("Auctioneer"),
    republishItem
  );
  

  export default router;
   