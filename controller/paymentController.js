const Payment = require('../models/paymentModel')
const User = require('../models/userModel')
const { depositSchema, withdrawSchema } = require('../Middlewares/paymentvalidation');
const { login } = require('./userController');

// Deposit Function
exports.deposit = async (req, res) => {
  try {
    // Validate input
    const { error } = depositSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { user, amount, deposit, utr } = req.body;

    const newDeposit = new Payment({
      user,
      amount,
      deposit,
      utr: utr || null,
      status: 'Pending',
      actionstatus: 'Pending'
    });

    await newDeposit.save();
    res.status(201).json({ message: 'Deposit request submitted', newDeposit });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Withdraw Function
exports.withdraw = async (req, res) => {
  try {
    // Validate input
    const { error } = withdrawSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { user, amount, withdraw, upi } = req.body;

    const newWithdraw = new Payment({
      user,
      amount,
      withdraw,
      upi: upi || null,
      status: 'Pending',
      actionstatus: 'Pending'
    });

    await newWithdraw.save();
    res.status(201).json({ message: 'Withdrawal request submitted', newWithdraw });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


exports.depositHistory = async (req, res) => {
  try {
    const { user } = req.params;

    // Fetch all deposit transactions for the user
    const deposits = await Payment.find({ user, deposit: { $ne: null } }).sort({ createdAt: -1 });

    if (deposits.length === 0) {
      return res.status(404).json({ message: 'No deposit history found' });
    }

    res.status(200).json({ message: 'Deposit history fetched successfully', deposits });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.withdrawHistory = async (req, res) => {
  try {
    const { user } = req.params;

    // Fetch all withdrawal transactions for the user
    const withdrawals = await Payment.find({ user, withdraw: { $ne: null } }).sort({ createdAt: -1 });

    if (withdrawals.length === 0) {
      return res.status(404).json({ message: 'No withdrawal history found' });
    }

    res.status(200).json({ message: 'Withdrawal history fetched successfully', withdrawals });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.pendingHistory = async (req, res) => {
  try {
    const { user } = req.params;
    const { status } = req.params;

    // Fetch all pending transactions for the user
    const pendingTransactions = await Payment.find({
      user,
      status
    }).sort({ createdAt: -1 });

    if (pendingTransactions.length === 0) {
      return res.status(404).json({ message: 'No pending transactions found' });
    }

    res.status(200).json({ message: 'Pending transactions fetched successfully', pendingTransactions });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


exports.getAllPayments = async (req, res) => {
  try {
    // Fetch all payments and populate user details (name, email, phone)
    const payments = await Payment.find().populate({
      path: 'user',
      select: 'name email phone' // Fetch only these fields from the User model
    }).sort({ createdAt: -1 });

    if (payments.length === 0) {
      return res.status(404).json({ message: 'No payments found' });
    }

    // Process each payment to calculate total balance
    const paymentDetails = payments.map(payment => {
      const totalDeposit = parseFloat(payment.deposit) || 0;
      const totalWithdraw = parseFloat(payment.withdraw) || 0;
      const totalBalance = totalDeposit - totalWithdraw;

      return {
        userName: payment.user?.name || 'N/A',
        email: payment.user?.email || 'N/A',
        mobile: payment.user?.phone || 'N/A',
        createdAt: payment.createdAt,
        totalBalance
      };
    });

    res.status(200).json({
      message: 'All payments fetched successfully',
      payments: paymentDetails
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


exports.getUserPaymentSummary = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch all payments for the given user
    const payments = await Payment.find({ user });

    if (payments.length === 0) {
      return res.status(404).json({ message: 'No payment history found for this user' });
    }

    // Calculate totals
    let totalDeposit = 0;
    let totalWithdraw = 0;
    let totalAmount = 0;

    payments.forEach(payment => {
      if (payment.deposit) {
        totalDeposit += parseFloat(payment.deposit) || 0;
      }
      if (payment.withdraw) {
        totalWithdraw += parseFloat(payment.withdraw) || 0;
      }
    });

    totalAmount = totalDeposit - totalWithdraw; // Final balance

    res.status(200).json({
      message: 'User payment summary fetched successfully',
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone
      },
      totalDeposit,
      totalWithdraw,
      totalAmount
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


exports.getDepositHistory = async (req, res) => {
  try {
    // Fetch all deposit transactions (where deposit field is not empty)
    const deposits = await Payment.find({ deposit: { $ne: null } }).populate({
      path: 'user',
      select: 'name email phone' // Fetch only these fields from the User model
    }).sort({ createdAt: -1 });

    if (deposits.length === 0) {
      return res.status(404).json({ message: 'No deposit history found' });
    }

    // Process each deposit entry
    const depositDetails = deposits.map(deposit => {
      return {
        userName: deposit.user?.name || 'N/A',
        email: deposit.user?.email || 'N/A',
        phone: deposit.user?.phone || 'N/A',
        utr: deposit.utr || 'N/A',
        totalDeposit: parseFloat(deposit.deposit) || 0
      };
    });

    res.status(200).json({
      message: 'Deposit history fetched successfully',
      deposits: depositDetails
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getWithdrawHistory = async (req, res) => {
  try {
    // Fetch all withdrawal transactions where withdraw field is not null
    const withdrawals = await Payment.find({ withdraw: { $ne: null } }).populate({
      path: 'user',
      select: 'name email phone' // Fetch user details
    }).sort({ createdAt: -1 });

    if (withdrawals.length === 0) {
      return res.status(404).json({ message: 'No withdrawal history found' });
    }

    // Process each withdrawal entry
    const withdrawalDetails = withdrawals.map(withdrawal => {
      return {
        userName: withdrawal.user?.name || 'N/A',
        email: withdrawal.user?.email || 'N/A',
        phone: withdrawal.user?.phone || 'N/A',
        upi: withdrawal.upi || 'N/A',
        amount: parseFloat(withdrawal.withdraw) || 0,
        status: withdrawal.status // Pending, Completed, Failed
      };
    });

    res.status(200).json({
      message: 'Withdrawal history fetched successfully',
      withdrawals: withdrawalDetails
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


exports.getPendingDeposits = async (req, res) => {
  try {
    // Fetch all deposit transactions where status is 'Pending'
    const pendingDeposits = await Payment.find({ status: 'Pending', deposit: { $ne: null } }).populate({
      path: 'user',
      select: 'name email phone' // Fetch user details
    }).sort({ createdAt: -1 });

    if (pendingDeposits.length === 0) {
      return res.status(404).json({ message: 'No pending deposits found' });
    }

    // Process each pending deposit entry
    const depositDetails = pendingDeposits.map(deposit => {
      return {
        userName: deposit.user?.name || 'N/A',
        email: deposit.user?.email || 'N/A',
        phone: deposit.user?.phone || 'N/A',
        utr: deposit.utr || 'N/A',
        amount: parseFloat(deposit.deposit) || 0
      };
    });

    res.status(200).json({
      message: 'Pending deposits fetched successfully',
      pendingDeposits: depositDetails
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getApprovedDeposits = async (req, res) => {
  try {
    // Fetch all deposit transactions where status is 'Completed' (approved deposits)
    const approvedDeposits = await Payment.find({ status: 'Completed', deposit: { $ne: null } }).populate({
      path: 'user',
      select: 'name email phone' // Fetch user details
    }).sort({ createdAt: -1 });

    if (approvedDeposits.length === 0) {
      return res.status(404).json({ message: 'No approved deposits found' });
    }

    // Process each approved deposit entry
    const depositDetails = approvedDeposits.map(deposit => {
      return {
        userName: deposit.user?.name || 'N/A',
        email: deposit.user?.email || 'N/A',
        phone: deposit.user?.phone || 'N/A',
        utr: deposit.utr || 'N/A',
        amount: parseFloat(deposit.deposit) || 0
      };
    });

    res.status(200).json({
      message: 'Approved deposits fetched successfully',
      approvedDeposits: depositDetails
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


exports.getRejectedDeposits = async (req, res) => {
  try {
    // Fetch all deposit transactions where status is 'Failed' (rejected deposits)
    const rejectedDeposits = await Payment.find({ status: 'Failed', deposit: { $ne: null } }).populate({
      path: 'user',
      select: 'name email phone' // Fetch user details
    }).sort({ createdAt: -1 });

    if (rejectedDeposits.length === 0) {
      return res.status(404).json({ message: 'No rejected deposits found' });
    }

    // Process each rejected deposit entry
    const depositDetails = rejectedDeposits.map(deposit => {
      return {
        userName: deposit.user?.name || 'N/A',
        email: deposit.user?.email || 'N/A',
        phone: deposit.user?.phone || 'N/A',
        utr: deposit.utr || 'N/A',
        amount: parseFloat(deposit.deposit) || 0
      };
    });

    res.status(200).json({
      message: 'Rejected deposits fetched successfully',
      rejectedDeposits: depositDetails
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


exports.getAllDeposits = async (req, res) => {
  try {
    // Fetch all deposit transactions
    const allDeposits = await Payment.find({ deposit: { $ne: null } }).populate({
      path: 'user',
      select: 'name phone' // Fetch user details
    }).sort({ createdAt: -1 });

    if (allDeposits.length === 0) {
      return res.status(404).json({ message: 'No deposits found' });
    }

    // Process each deposit entry
    const depositDetails = allDeposits.map(deposit => {
      return {
        userName: deposit.user?.name || 'N/A',
        phone: deposit.user?.phone || 'N/A',
        utr: deposit.utr || 'N/A',
        date: deposit.createdAt.toISOString().split('T')[0], // Format date YYYY-MM-DD
        amount: parseFloat(deposit.deposit) || 0,
        status: deposit.status
      };
    });

    res.status(200).json({
      message: 'All deposits fetched successfully',
      deposits: depositDetails
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getUserDeposits = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch all deposit transactions for the user
    const userDeposits = await Payment.find({ user, deposit: { $ne: null } })
      .sort({ createdAt: -1 });

    if (userDeposits.length === 0) {
      return res.status(404).json({ message: 'No deposit history found for this user' });
    }

    // Process each deposit entry
    const depositDetails = userDeposits.map(deposit => {
      return {
        userName: user.name,
        email: user.email || 'N/A',
        phone: user.phone || 'N/A',
        date: deposit.createdAt.toISOString().split('T')[0], // Format date YYYY-MM-DD
        amount: parseFloat(deposit.deposit) || 0,
        utr: deposit.utr || 'N/A',
        status: deposit.status
      };
    });

    res.status(200).json({
      message: 'User deposit history fetched successfully',
      deposits: depositDetails
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// withdrawals

exports.getPendingWithdrawals = async (req, res) => {
  try {
    // Fetch all pending withdrawal transactions
    const pendingWithdrawals = await Payment.find({ status: 'Pending', withdraw: { $ne: null } }).populate({
      path: 'user',
      select: 'name email phone' // Fetch user details
    }).sort({ createdAt: -1 });

    if (pendingWithdrawals.length === 0) {
      return res.status(404).json({ message: 'No pending withdrawals found' });
    }

    // Process each withdrawal entry
    const withdrawalDetails = pendingWithdrawals.map(withdrawal => {
      return {
        userName: withdrawal.user?.name || 'N/A',
        email: withdrawal.user?.email || 'N/A',
        phone: withdrawal.user?.phone || 'N/A',
        upi: withdrawal.upi || 'N/A',
        amount: parseFloat(withdrawal.withdraw) || 0,
        status: withdrawal.status
      };
    });

    res.status(200).json({
      message: 'Pending withdrawals fetched successfully',
      withdrawals: withdrawalDetails
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


exports.getApprovedWithdrawals = async (req, res) => {
  try {
    // Fetch all approved withdrawal transactions
    const approvedWithdrawals = await Payment.find({ status: 'Completed', withdraw: { $ne: null } }).populate({
      path: 'user',
      select: 'name email phone' // Fetch user details
    }).sort({ createdAt: -1 });

    if (approvedWithdrawals.length === 0) {
      return res.status(404).json({ message: 'No approved withdrawals found' });
    }

    // Process each withdrawal entry
    const withdrawalDetails = approvedWithdrawals.map(withdrawal => {
      return {
        userName: withdrawal.user?.name || 'N/A',
        email: withdrawal.user?.email || 'N/A',
        phone: withdrawal.user?.phone || 'N/A',
        upi: withdrawal.upi || 'N/A',
        amount: parseFloat(withdrawal.withdraw) || 0,
        status: withdrawal.status
      };
    });

    res.status(200).json({
      message: 'Approved withdrawals fetched successfully',
      withdrawals: withdrawalDetails
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


exports.getRejectedWithdrawals = async (req, res) => {
  try {
    // Fetch all rejected withdrawal transactions
    const rejectedWithdrawals = await Payment.find({ status: 'Failed', withdraw: { $ne: null } })
      .populate({
        path: 'user',
        select: 'name email phone' // Fetch user details
      })
      .sort({ createdAt: -1 });

    if (rejectedWithdrawals.length === 0) {
      return res.status(404).json({ message: 'No rejected withdrawals found' });
    }

    // Process each withdrawal entry
    const withdrawalDetails = rejectedWithdrawals.map(withdrawal => {
      return {
        userName: withdrawal.user?.name || 'N/A',
        email: withdrawal.user?.email || 'N/A',
        phone: withdrawal.user?.phone || 'N/A',
        upi: withdrawal.upi || 'N/A',
        amount: parseFloat(withdrawal.withdraw) || 0,
        status: withdrawal.status
      };
    });

    res.status(200).json({
      message: 'Rejected withdrawals fetched successfully',
      withdrawals: withdrawalDetails
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getAllWithdrawals = async (req, res) => {
  try {
    // Fetch all withdrawal transactions (Pending, Completed, Failed)
    const allWithdrawals = await Payment.find({ withdraw: { $ne: null } })
      .populate({
        path: 'user',
        select: 'name email phone' // Fetch user details
      })
      .sort({ createdAt: -1 });

    if (allWithdrawals.length === 0) {
      return res.status(404).json({ message: 'No withdrawals found' });
    }

    // Process each withdrawal entry
    const withdrawalDetails = allWithdrawals.map(withdrawal => {
      return {
        userName: withdrawal.user?.name || 'N/A',
        email: withdrawal.user?.email || 'N/A',
        phone: withdrawal.user?.phone || 'N/A',
        upi: withdrawal.upi || 'N/A',
        amount: parseFloat(withdrawal.withdraw) || 0,
        status: withdrawal.status,
        createdAt: withdrawal.createdAt
      };
    });

    res.status(200).json({
      message: 'All withdrawals fetched successfully',
      withdrawals: withdrawalDetails
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getUserWithdrawals = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch all withdrawals for the given user
    const userWithdrawals = await Payment.find({ user, withdraw: { $ne: null } })
      .sort({ createdAt: -1 });

    if (userWithdrawals.length === 0) {
      return res.status(404).json({ message: 'No withdrawals found for this user' });
    }

    // Process each withdrawal entry
    const withdrawalDetails = userWithdrawals.map(withdrawal => {
      return {
        userName: user.name || 'N/A',
        email: user.email || 'N/A',
        phone: user.phone || 'N/A',
        upi: withdrawal.upi || 'N/A',
        amount: parseFloat(withdrawal.withdraw) || 0,
        status: withdrawal.status,
        createdAt: withdrawal.createdAt
      };
    });

    res.status(200).json({
      message: 'User withdrawal details fetched successfully',
      withdrawals: withdrawalDetails
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


exports.requestDeposit = async (req, res) => {
  try {
    const { user, amount, utr } = req.body;

    if (!user || !amount || !utr) {
      return res.status(400).json({ message: "User ID, Amount, and UTR are required" });
    }

    // Create a new deposit request with "Pending" status
    const newDeposit = new Payment({
      user,
      amount,
      deposit: amount,
      withdraw: null,
      utr,
      status: "Pending",
      actionstatus: "Pending",
    });

    await newDeposit.save();

    res.status(201).json({ message: "Deposit request submitted successfully", deposit: newDeposit });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
