const express = require('express');

const {
  getFinancialSummary,
  listTransactions,
} = require('../controllers/finance-controller');

const {
  createExpense,
  createIncome,
  deleteTransaction,
  getTransaction,
  updateExpense,
  updateIncome,
} = require('../controllers/transaction-controller');

const authenticate = require('../middleware/auth-middleware');

const router = express.Router();

router.use(authenticate);

router.get('/summary', getFinancialSummary);
router.get('/', listTransactions);
router.get('/:type/:id', getTransaction);

router.post('/income', createIncome);
router.post('/expense', createExpense);
router.put('/income/:id', updateIncome);
router.put('/expense/:id', updateExpense);
router.delete('/:type/:id', deleteTransaction);

module.exports = router;
