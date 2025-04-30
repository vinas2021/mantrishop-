const express = require('express');
const router = express.Router();
const paymentController = require('../controller/paymentController');

const {authantication,authorize} = require('../Middlewares/auth')

router.post('/deposit',authantication, paymentController.deposit);
router.post('/withdraw', paymentController.withdraw);
router.get('/deposit-history/:user', paymentController.depositHistory);
router.get('/withdraw-history/:user', paymentController.withdrawHistory);
router.get('/pending-history/:user', paymentController.pendingHistory);
router.get('/all-payments',authantication,authorize, paymentController.getAllPayments);
router.get('/user-payment-summary/:user', paymentController.getUserPaymentSummary);
router.get('/deposit-history', paymentController.getDepositHistory);
router.get('/withdraw-history', paymentController.getWithdrawHistory);
router.get('/pending-deposits', paymentController.getPendingDeposits);
router.get('/approved-deposits', paymentController.getApprovedDeposits);
router.get('/rejected-deposits', paymentController.getRejectedDeposits);
router.get('/all-deposits', paymentController.getAllDeposits);
router.get('/user-deposits/:user', paymentController.getUserDeposits);

router.get('/pending-withdrawals', paymentController.getPendingWithdrawals);
router.get('/approved-withdrawals', paymentController.getApprovedWithdrawals);
router.get('/rejected-withdrawals', paymentController.getRejectedWithdrawals);
router.get('/all-withdrawals', paymentController.getAllWithdrawals);
router.get('/user-withdrawals/:user', paymentController.getUserWithdrawals);

// admin
router.post('/request-deposit',authantication,authorize, paymentController.requestDeposit);
module.exports = router;
