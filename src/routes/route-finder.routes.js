const { Router } = require("express");
const c = require("../controllers/route-finder.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { routeFinderValidation } = require("../middlewares/validate.middleware");

const router = Router();

router.use(authenticate);

router.get("/:id", c.getDetails);
router.get("/", routeFinderValidation.search, c.search);

module.exports = router;