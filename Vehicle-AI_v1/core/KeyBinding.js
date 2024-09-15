class KeyBinding {
  constructor() {
      var code = [];
      for (var _i = 0; _i < arguments.length; _i++) {
          code[_i] = arguments[_i];
      }
      this.isPressed = false;
      this.justPressed = false;
      this.justReleased = false;
      this.eventCodes = code;
  }
}

export { KeyBinding };
