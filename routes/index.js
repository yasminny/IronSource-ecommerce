let express = require('express');
let router = express.Router();
const level = require('level');
const sublevel = require('level-sublevel');
const db = sublevel(level('./db', {valueEncoding: 'json'}));
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'hire.yasmin.nygate@gmail.com',
    pass: 'hireme123'
  }
});

// helper function while creating the project or for future use
function clearDb() {
  let keyArray = [];
  db.createKeyStream()
    .on('data', function (data) {
      keyArray.push(data);
      console.log(keyArray);
    })
    .on('end', function () {
      keyArray.forEach((key) => {
        db.del(key, function (err) {
        });
      });
    });
}

// -------------read url routs-------------

/* back office page. */
router.get('/getData', function (req, res, next) {
  let baseData = [];
  db.createValueStream()
    .on('data', function (data) {
      baseData.push(data);
    })
    .on('end', function () {
      let template = '';
      baseData.forEach((obj) => {
        return template += `<li class="order">First name: ${obj.firstName}<br/>Last name: ${obj.lastName}<br/>Email: ${obj.email}<br/>Location: ${obj.location}</li>`;
      });
      res.render('getData', {list: template});
    });
});

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index');
  // clearDb();
});

router.get('/purchase', function (req, res, next) {
  res.render('purcahse');
});

router.get('/submit', function (req, res, next) {
  res.render('submit');
});


/* inputs data into leveldb and send email*/
router.post('/xhrAddToData', (req, res) => {
  let newSubmit = req.body;

  let mailOptionsOk = {
    from: "Yasmin Nygate <hire.yasmin.nygate@gmail.com>",
    to: newSubmit.email,
    subject: `Thank you ${newSubmit.firstName} for the hire!`,
    text: 'You have chosen well! I will do my best to live up to your expectation.'
  };

  let mailOptionsNotOk = {
    from: "Yasmin Nygate <hire.yasmin.nygate@gmail.com>",
    to: newSubmit.email,
    subject: `Thank you ${newSubmit.firstName} for the hire but...`,
    text: 'Sadly, I could not save your details... why not try to submit again?'
  };

  const key = `${newSubmit.firstName} ${newSubmit.lastName}`;
  db.put(key, newSubmit);
  db.get(key, function (err) {
    if (err) {
      transporter.sendMail(mailOptionsNotOk, function (err, res) {
        if (err) {
          console.log('Error with sending the not ok email', err);
        }
        else {
          console.log('Email Sent', res);
        }
      });
    }
    else {
      transporter.sendMail(mailOptionsOk, function (err, res) {
        if (err) {
          console.log('Error with sending the ok email', err);
        }
        else {
          console.log('Email Sent', res);
        }
      });
    }
    res.send('OK');
  });
});

module.exports = router;
