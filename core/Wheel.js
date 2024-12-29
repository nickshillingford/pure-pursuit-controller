class Wheel {
  constructor(wheelObject) {
      this.steering = false;
      this.wheelObject = wheelObject;
      this.position = wheelObject.position;

      if (wheelObject.hasOwnProperty('userData') && wheelObject.userData.hasOwnProperty('data')) {
          if (wheelObject.userData.hasOwnProperty('steering')) {
              this.steering = (wheelObject.userData.steering === 'true');
          }
          if (wheelObject.userData.hasOwnProperty('drive')) {
              this.drive = wheelObject.userData.drive;
          }
      }
  }
}

export { Wheel };
