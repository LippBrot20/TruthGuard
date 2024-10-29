var express = require('express');
var router = express.Router();
const { summarizeText } = require('../openai');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/summarize', async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Text is required" });
  }

  try {
    const summary = await summarizeText(text);
    res.json({ summary });
  } catch (error) {
    res.status(500).json({ error: "Error generating summary" });
  }
});

module.exports = router;
