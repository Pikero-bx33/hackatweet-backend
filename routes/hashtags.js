var express = require("express");
var router = express.Router();

const { getUser } = require('../modules/common');
const Post = require('../models/posts');
// const Hashtag = require('../models/hashtags');

// Récupérer tous les hashtags triés par trend descendant (nb utilisations) ---
router.get("/all", async (req, res) => {
 
    const token = req.headers.token;
    const userDetails = await getUser(token);

    if (!userDetails.result) {
      return res.json({ result: false, error: "Token invalide" });
    }

Post.aggregate([
  { // https://www.mongodb.com/docs/manual/reference/operator/aggregation/unwind/
    $unwind: '$hashtags' // "déplie" le tableau : 1 doc par hashtag
  },
  {
    $group: { // https://www.mongodb.com/docs/manual/reference/operator/aggregation/group/
      _id: '$hashtags', // groupe par _id (ObjectId) du hashtag
      count: { $sum: 1 }
    }
  },
  {
    $lookup: {
      from: 'hashtags', // nom de la collection
      localField: '_id', // champ dans le résultat du $group
      foreignField: '_id', // champ _id dans la collection hashtags
      as: 'hashtagDetails' // nom du champ qui contiendra le(s) doc(s) populé(s)
    }
  },
  {
    $unwind: {
      path: '$hashtagDetails',
    }
  },
  {
    $sort: { count: -1 }
  },
  {
    $project: { // optionnel : reformate la sortie
      count: 1, //  inclut le champ count
        _id: '$hashtagDetails._id',
        name: '$hashtagDetails.name',
    //   }
    }
  }
])
.then(results => {
    res.json({
        result: true,
        hashtags: results,
    });
})
.catch(err => 
    {
        res.json({ result: false, error: err });
});

  
});

module.exports = router;