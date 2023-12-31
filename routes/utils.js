function findObjectsWithHighestPrice(objects) {
    console.log('objects', objects)
    const highestPrice = objects.reduce((acc, obj) => {
      return obj.biddingPrice > acc ? obj.biddingPrice : acc;
    }, 0);
    console.log('highestPrice', highestPrice)
    const objectsWithHighestPrice = objects.filter(obj => obj.biddingPrice === highestPrice);
    return objectsWithHighestPrice;
  }
  module.exports = findObjectsWithHighestPrice