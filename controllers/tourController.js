// const fs = require('fs');

const AppError = require('../utils/appError');
const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');

exports.bestTours = (req, res, next) => {
  req.query.limit = +5;
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAllTours = catchAsync(async (req, res) => {
  console.log(req.query);

  // 1A) Filtering
  // const queryObject = { ...req.query };
  // const exculdedFields = ['page', 'sort', 'limit', 'fields'];
  // exculdedFields.forEach(el => delete queryObject[el]);

  // // 1B) Advanced Filtering
  // let queryStr = JSON.stringify(queryObject);
  // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
  // console.log(JSON.parse(queryStr));

  // let query = Tour.find(JSON.parse(queryStr));

  // 2) Sorting
  // if (req.query.sort) {
  //   // query=query.sort(req.query.sort)
  //   query = Tour.find().sort(req.query.sort);
  // } else {
  //   query = Tour.find().sort('-createdAt');
  // }

  // 3) Field Liminting
  // if (req.query.fields) {
  //   const fields = req.query.fields.split(',').join(' ');
  //   query = Tour.find({}, fields);
  // } else {
  //   query = Tour.find({}, '-__v');
  // }

  // 4)pagination
  // const page = +req.query.page || 1;
  // const limit = +req.query.limit || 100;
  // const skip = (page - 1) * limit;

  // query = query.skip(skip).limit(limit);

  // if (req.query.page) {
  //   const numTours = await Tour.countDocuments;
  //   if (skip >= numTours) throw new Error(`this page doesn't exist`);
  // }

  // EXECUTE QUERY
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const tours = await features.query;
  // console.log(req.query, queryObject);
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours
    }
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // const tour = await Tour.findById(req.params.id)
  const tour = await Tour.findOne({ _id: req.params.id });

  if (!tour) {
    return next(
      new AppError(`can't find a tour with this id: ${req.params.id}`)
    );
  }
  res.status(200).json({
    status: 'success',
    data: {
      tour
    }
  });
});

exports.createTour = catchAsync(async (req, res) => {
  const newTour = await Tour.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      tour: newTour
    }
  });
});

exports.updateTour = catchAsync(async (req, res) => {
  // const tour = await Tour.updateOne({ _id: req.params.id }, req.body, {
  //   new: true,
  //   runValidators: true
  // });
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    data: {
      tour: tour
    }
  });
});

exports.deleteTour = catchAsync(async (req, res) => {
  // await Tour.findByIdAndDelete(req.params.id)
  await Tour.deleteOne({ _id: req.params.id });
  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.getTourStats = catchAsync(async (req, res) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      $group: {
        _id: null,
        numTours: { $sum: 1 },
        numRating: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    {
      sort: { avgPrice: 1 }
    }
  ]);
  res.status(200).json({
    status: 'success',
    data: stats
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res) => {
  const year = +req.params.year;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates'
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' }
      }
    },
    {
      $addFields: { month: '$_id' }
    },
    {
      $project: {
        _id: 0
      }
    },
    {
      $sort: { numTourStarts: -1 }
    },
    {
      $limit: 12
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: plan
  });
});
