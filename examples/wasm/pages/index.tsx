import React, { useState, useEffect, useRef } from "react";
import { _Z4facti as factorial } from "./factorial.wasm";

export default function () {
  const [log, _log] = useState([]);
  const dinoRef = useRef(null);

  const $log = (message: string) => {
    log.push(message);
    _log(log.slice(0));
  };

  useEffect(() => {
    $log("---- Sync Wasm Module ----");
    $log(factorial(1));
    $log(factorial(2));
    $log(factorial(3));

    import("./factorial.wasm").then(({ _Z4facti: AsyncFactorial }) => {
      $log("---- Async Wasm Module ----");
      $log(AsyncFactorial); // [native code]
      $log(AsyncFactorial(1));
      $log(AsyncFactorial(2));
      $log(AsyncFactorial(3));
    });

    fetch("dino.wasm")
      .then((response) => response.arrayBuffer())
      .then((bytes) => WebAssembly.instantiate(bytes, { Math }))
      .then((source) => {
        let instance = source.instance;
        let canvasData = new Uint8Array(
          instance.exports.mem.buffer,
          0x5000,
          90000
        );
        let canvas = dinoRef.current;
        let context = canvas.getContext("2d");
        let imageData = context.createImageData(300, 75);
        let u8 = new Uint8Array(instance.exports.mem.buffer, 0, 4);
        let onkey = (down, event) => {
          let bit;
          switch (event.code) {
            case "ArrowUp":
              bit = 1;
              break;
            case "ArrowDown":
              bit = 2;
              break;
            default:
              return;
          }
          if (down) {
            u8[0] |= bit;
          } else {
            u8[0] &= ~bit;
          }
        };
        document.addEventListener("keydown", onkey.bind(null, 1), false);
        document.addEventListener("keyup", onkey.bind(null, 0), false);

        let touches = {};
        let ontouch = (down, event) => {
          for (let touch of event.changedTouches) {
            if (down) {
              let bit;
              if (touch.clientX < event.target.clientWidth * 0.5) {
                bit = 2; // down
              } else {
                bit = 1; // up
              }
              u8[0] |= bit;
              touches[touch.identifier] = bit;
            } else {
              u8[0] &= ~touches[touch.identifier];
              delete touches[touch.identifier];
            }
          }
          event.preventDefault();
        };
        canvas.addEventListener("touchstart", ontouch.bind(null, 1), false);
        canvas.addEventListener("touchend", ontouch.bind(null, 0), false);

        (function update() {
          requestAnimationFrame(update);
          instance.exports.run();
          imageData.data.set(canvasData);
          context.putImageData(imageData, 0, 0);
        })();
      });
  }, []);

  return (
    <div>
      {log.map((message) => (
        <div>{message}</div>
      ))}
      <canvas width="300" height="75" ref={dinoRef} />
    </div>
  );
}
