import express from "express";
import { connect, refresh } from "../controllers/authController.js";

const router = express.Router();

router.get("/connect", connect);
router.post("/refresh", refresh);

// callback route is registered dynamically in app.js based on REDIRECT_URI
export default router;
