const { json } = require("express/lib/response");
const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

const list = (req, res) => {
    res.json({ data: orders });
};

const hasValidProperty = (property) => {
    return (req, res, next) => {
      const { data = {} } = req.body;
      // Validates id property
      if (property === "id") {
        const { orderId } = req.params;
        data[property] === orderId || !data[property]
          ? next()
          : next({
              status: 400,
              message: `Order id does not match route id. Order: ${data[property]}, Route: ${orderId}.`,
            });
      }
      // Validates status property
      if (property === "status") {
        const status = data[property];
        if (!status || status === "invalid") {
          next({
            status: 400,
            message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
          });
        } else if (status === "delivered") {
          next({ status: 400, message: "A delivered order cannot be changed" });
        }
        next();
      }
      // Checks if property exists
      if (data[property]) {
        // Validates dishes property
        if (property === "dishes") {
          const dishes = data[property];
          if (dishes.length > 0 && Array.isArray(dishes)) {
            dishes.map((dish, index) => {
              if (
                !dish.quantity ||
                dish.quantity <= 0 ||
                dish.quantity !== Number(dish.quantity)
              ) {
                next({
                  status: 400,
                  message: `Dish ${index} must have a quantity that is an integer greater than 0`,
                });
              }
            });
          } else {
            next({
              status: 400,
              message: `Order must include at least one dish`,
            });
          }
        }
        next();
      } else {
        next({
          status: 400,
          message: `Order must include a ${property}`,
        });
      }
    };
};



const create = (req, res) => {
    const { data: { deliverTo, mobileNumber, status, dishes } } = req.body;
    const id = nextId();

    const newOrder = {
        id,
        deliverTo,
        mobileNumber,
        status,
        dishes,
    }
    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
}

const read = (req, res) => {
    const foundOrder = res.locals.order;

    res.json({ data: foundOrder });
}

const orderExists = (req,res,next) => {
    const { orderId } = req.params;
    const foundOrder = orders.find((order) => order.id == orderId);
    
    if(foundOrder) {
        res.locals.order = foundOrder
        return next();
    }
    next({ status: 404, message: `Order id does not exist: ${ orderId }`});
}

const deleteValidator = (req, res, next) => {
    const foundOrder = res.locals.order;
    
    if(foundOrder.status == "pending"){
        return next()
    }
    next({ status: 400, message: "An order cannot be deleted unless it is pending"});
}

const update = (req,res) => {
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
    const foundOrder = res.locals.order

   updatedOrder = {
       id: foundOrder.id,
       deliverTo,
       mobileNumber,
       status,
       dishes,
   }

    res.json({ data: updatedOrder });
}

const destroy = (req,res) => {
    const { orderId } = req.params;
    const index = orders.findIndex((order) => order.id == orderId);

    if(index > -1) {
        orders.splice(index,1);
    }
    res.sendStatus(204);
}

module.exports = {
    list,
    create: [
      hasValidProperty("deliverTo"),
      hasValidProperty("mobileNumber"),
      hasValidProperty("dishes"),
      create,
    ],
    update: [
      orderExists,
      hasValidProperty("deliverTo"),
      hasValidProperty("mobileNumber"),
      hasValidProperty("dishes"),
      hasValidProperty("id"),
      hasValidProperty("status"),
      update,  
    ],
    read: [orderExists, read],
    delete: [orderExists,deleteValidator,destroy],
};