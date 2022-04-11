const res = require("express/lib/response");
const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

const list = ( req, res, next ) => {
    res.json({ data: dishes });
};

const hasValidProperty = (property) => {
    return (req, res, next) => {
      const { data = {} } = req.body;
      if (property === "id") {
        const { dishId } = req.params;
        dishId === data[property] || !data[property]
          ? next()
          : next({
              status: 400,
              message: `Dish id does not match: ${data[property]}`,
            });
      }
      if (data[property]) {
        if (property === "price") {
          data[property] > 0 && data[property] === Number(data[property])
            ? next()
            : next({
                status: 400,
                message:
                  "Dish must have a price that is an integer greater than 0",
              });
        } else {
          data[property].length > 0
            ? next()
            : next({ status: 400, message: `Must include a ${property}` });
        }
      } else {
        next({
          status: 400,
          message: `Dish must include a ${property}`,
        });
      }
    };
  };

const dishExists = (req,res,next) => {
    const { dishId } = req.params;
    const foundDish = dishes.find((dish) => dish.id == dishId);
    if(foundDish) {
        res.locals.dish = foundDish;
        return next();
    }
    next({ status:404, message: `Dish ID does not exist: ${dishId}`});
};

const create = (req, res) => {
    const { data: { name, description, price, image_url } } = req.body;
    const id = nextId();
    const newDish = {
        id,
        name,
        description,
        price,
        image_url,
    };

    dishes.push(newDish);
    res.status(201).json({ data: newDish });
};

const update = (req,res) => {
    const { data: { name, description, price, image_url } = {} } = req.body;
    let foundDish = res.locals.dish

    updatedDish = {
        id: foundDish.id,
        name,
        description,
        price,
        image_url,
    }
    
    res.json({ data: updatedDish });
};

const read = (req, res) => {
   const foundDish = res.locals.dish;

    res.json({ data: foundDish });
};


module.exports= {
    list,
    create:[
        hasValidProperty("name"),
        hasValidProperty("description"),
        hasValidProperty("price"),
        hasValidProperty("image_url"),
        create,
    ],
    update:[
        dishExists,
        hasValidProperty("id"),
        hasValidProperty("name"),
        hasValidProperty("description"),
        hasValidProperty("price"),
        hasValidProperty("image_url"),
        update,
    ], 
    read: [dishExists, read],
};