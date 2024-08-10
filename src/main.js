import kaplay from "kaplay";

const k = kaplay({
  canvas: document.getElementById("folio"),
  touchToMouse: true,
  global: false,
})

function displayDialogue(text, onEnd) {
  const dialogueBox = document.getElementById("textbox");
  const dialogue = document.getElementById("dialogue");

  dialogueBox.style.display = "block";

  let index = 0;
  let currentText = "";

  const intervalRef = setInterval(() => {
    if (index < text.length) {
      currentText += text[index];
      dialogue.innerHTML = currentText;
      index++;
      return;
    }

    clearInterval(intervalRef);
  }, 1);

  const buttonClose = document.getElementById("close");

  function onCloseClick() {
    onEnd();
    dialogueBox.style.display = "none";
    dialogue.innerHTML = "";
    clearInterval(intervalRef);
    buttonClose.removeEventListener("click", onCloseClick);
  }

  buttonClose.addEventListener("click", onCloseClick);

  addEventListener("keypress", (key) => {
    if (key.code === "Enter") {
      buttonClose.click();
    }
  });
  }

function setCamScale(k) {
  const resizeFactor = k.width() / k.height();
  if (resizeFactor < 1) {
    k.camScale(k.vec2(1));
  } else {
    k.camScale(k.vec2(1.5));
  }
}

const scaleF = 4;

const dialogueData = {
    pc: "",
    bed: "",
    resume: "",
    envelope: "",
    switch: "",
    calendar: "",
  };

k.loadSprite("yuki", "assets/yuki-sheet.png", {
    sliceX: 4,
    sliceY: 4,
    anims: {
        "idle-down": 0,
        "walk-down": { from: 0, to: 3, loop: true, speed: 8},
        "idle-side": 4,
        "walk-side": { from: 4, to: 7, loop: true, speed: 8},
        "idle-up": 8,
        "walk-up": { from: 8, to: 11, loop: true, speed: 8},
    }
});

k.loadSprite("map", "assets/map.png");

k.setBackground(k.Color.fromHex("#171717"));

k.scene("main", async () => {
    const mapData = await (await fetch("assets/map.json")).json();
    const layers = mapData.layers;
  
    const map = k.add([
        k.sprite("map"), 
        k.pos(), 
        k.scale(scaleF)]);
  
    const player = k.make([
      k.sprite("yuki", { anim: "idle-down" }),
      k.area({
        shape: new k.Rect(k.vec2(0, 3), 10, 10),
      }),
      k.body(),
      k.anchor("center"),
      k.pos(),
      k.scale(scaleF),
      {
        speed: 250,
        direction: "down",
        isInDialogue: false,
      },
      "player",
    ]);
  
    for (const layer of layers) {
        if (layer.name === "boundaries") {
          for (const boundary of layer.objects) {
            if(boundary.name === "gate") {
                continue;
            }
            map.add([
              k.area({
                shape: new k.Rect(k.vec2(0), boundary.width, boundary.height),
              }),
              k.body({ isStatic: true }),
              k.pos(boundary.x, boundary.y),
              boundary.name,
            ]);
    
            if (boundary.name) {
                if (boundary.name === "gate") {
                    continue;
                }
              player.onCollide(boundary.name, () => {
                player.isInDialogue = true;
                displayDialogue(
                  dialogueData[boundary.name],
                  () => (player.isInDialogue = false)
                );
              });
            }
          }
          continue;
        }
    
        if (layer.name === "spawn") {
            for (const entity of layer.objects) {
              if (entity.name === "player") {
                player.pos = k.vec2(
                  (map.pos.x + entity.x) * scaleF,
                  (map.pos.y + entity.y) * scaleF
                );
                k.add(player);
                continue;
              }
            }
          }
      }

      setCamScale(k);

      k.onResize(() => {
        setCamScale(k);
      });
    
      k.onUpdate(() => {
        k.camPos(player.worldPos().x, player.worldPos().y - 100);
      });
    
      k.onMouseDown((mouseBtn) => {
        if (mouseBtn !== "left" || player.isInDialogue) return;
    
        const worldMousePos = k.toWorld(k.mousePos());
        player.moveTo(worldMousePos, player.speed);
    
        const mouseAngle = player.pos.angle(worldMousePos);
    
        const lowerBound = 50;
        const upperBound = 125;
        
        if (
          mouseAngle > lowerBound &&
          mouseAngle < upperBound &&
          player.getCurAnim().name !== "walk-up"
        ) {
          player.play("walk-up");
          player.direction = "up";
          return;
        }
    
        if (
          mouseAngle < -lowerBound &&
          mouseAngle > -upperBound &&
          player.getCurAnim().name !== "walk-down"
        ) {
          player.play("walk-down");
          player.direction = "down";
          return;
        }
    
        if (Math.abs(mouseAngle) > upperBound) {
          player.flipX = false;
          if (player.getCurAnim().name !== "walk-side") player.play("walk-side");
          player.direction = "right";
          return;
        }
    
        if (Math.abs(mouseAngle) < lowerBound) {
          player.flipX = true;
          if (player.getCurAnim().name !== "walk-side") player.play("walk-side");
          player.direction = "left";
          return;
        }
      });
    
      function stopAnims() {
        if (player.direction === "down") {
          player.play("idle-down");
          return;
        }
        if (player.direction === "up") {
          player.play("idle-up");
          return;
        }
    
        player.play("idle-side");
      }
    
      k.onMouseRelease(stopAnims);
    
      k.onKeyRelease(() => {
        stopAnims();
      });

      k.onKeyDown((key) => {
        const keyMap = [
          k.isKeyDown("d"),
          k.isKeyDown("a"),
          k.isKeyDown("w"),
          k.isKeyDown("s"),
        ];
    
        let nbOfKeyPressed = 0;
        for (const key of keyMap) {
          if (key) {
            nbOfKeyPressed++;
          }
        }
    
        if (nbOfKeyPressed > 1) return;
    
        if (player.isInDialogue) return;
        if (keyMap[0]) {
          player.flipX = false;
          if (player.getCurAnim().name !== "walk-side") player.play("walk-side");
          player.direction = "right";
          player.move(player.speed, 0);
          return;
        }
    
        if (keyMap[1]) {
          player.flipX = true;
          if (player.getCurAnim().name !== "walk-side") player.play("walk-side");
          player.direction = "left";
          player.move(-player.speed, 0);
          return;
        }
    
        if (keyMap[2]) {
          if (player.getCurAnim().name !== "walk-up") player.play("walk-up");
          player.direction = "up";
          player.move(0, -player.speed);
          return;
        }
    
        if (keyMap[3]) {
          if (player.getCurAnim().name !== "walk-down") player.play("walk-down");
          player.direction = "down";
          player.move(0, player.speed);
        }
      });
    });
    
k.go("main");