const express=require('express');
const router=express.Router();
const firController=require('../controllers/fir.controller');
const {authenticateToken}=require('../middlewares/auth.middleware');
const {requireRoles}=require('../middlewares/rbac.middleware');

router.use(authenticateToken);
router.use(requireRoles('DESK_OFFICER', 'SHO', 'SUPERVISOR'));

router.get('/inbox', firController.getStationInbox);

module.exports=router;