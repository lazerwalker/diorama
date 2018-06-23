import 'aframe';

// See how the default event system works in terms of clicking on things, and if I can get the behavior I want of "click on anything = remove text"
require('aframe-extras');
require('aframe-look-at-component')

const Mode = {
  EDIT: "edit",
  PLAY: "play"
}

class App {
  state = {
    mode: Mode.EDIT,
    objects: {
      "wol": {
        id: 'wol',
        width: 1.4,
        height: 1.6,
        position: {x: 0.0, y: 1.6, z: -5.0},
        text: "Howdy pardner!",
        animation: {
          images: ["#wol", "#wol2"],
          framerate: 300,
          currentFrame: 1
        }
      },
      "wol2": {
        id: 'wol2',
        image: "#wol2",
        width: 1.4,
        height: 1.6,
        position: {x: 3.0, y: 1.6, z: -8.0},
        text: "Woah, I was placed!"
      }
    }
  }
    constructor() {
    //  const interval = Math.min(...Object.values(this.state.objects)
    //     .map((o) => o.animation ? o.animation.framerate : Infinity))
    // setInterval(() => {
    //   const obj = this.state.objects["wol"]
    //   if (obj) {
    //     let newFrame = obj.animation.currentFrame + 1
    //     if (newFrame >= obj.animation.images.length) { newFrame = 0; }

    //     let newAnimation = {...obj.animation, currentFrame: newFrame}
    //     let newObj = {...obj, animation: newAnimation}
    //     let newObjects = {...that.state.objects, wol: newObj}
    //     this.setState({objects: newObjects})
    //   }

    //   if (this.state.holding && that.state.holding.animation) {
    //     let holding = that.state.holding
    //     let newFrame = holding.animation.currentFrame + 1
    //     if (newFrame >= holding.animation.images.length) { newFrame = 0; }

    //     let newAnimation = {...holding.animation, currentFrame: newFrame}
    //     let newObj = {...holding, animation: newAnimation}
    //     that.setState({holding: newObj})
    //   }
    // }, interval)
    
    this.createScene()
    this.el = document.querySelector('a-scene');
    Object.keys(this.state.objects).forEach(key => {
      const element = this.state.objects[key]
      const el = this.billboardToEntity(element)
      this.el.appendChild(el)
    });
  }

  createScene() {
    const el = document.createElement('a-scene');
    el.id= "scene"
    el.setAttribute('cursor', 'rayOrigin: mouse')

    const assetList = {
      wol: "WoL.png",
      wol2: "WoL2.png"
    }

    const assets = document.createElement('a-assets')
    Object.keys(assetList).forEach((key) => {
      const img = document.createElement('img')
      img.id = key
      img.src = assetList[key]

      assets.appendChild(img)
    })
    el.appendChild(assets)

    const rig = document.createElement('a-entity')
    rig.id = 'rig'
    rig.setAttribute('movement-control')
    rig.setAttribute('position', '0 0 0')
    el.appendChild(rig)

    const camera = document.createElement('a-camera')
    // camera.setAttribute('look-controls', 'pointer-lock-enabled: true')
    camera.setAttribute('position', '0 1.6 0')
    rig.appendChild(camera)

    // TODO: Append cursor/text to camera

    const leftHand = document.createElement('a-entity')
    leftHand.setAttribute('hand-controls', 'left')
    el.appendChild(leftHand)

    const rightHand = document.createElement('a-entity')
    leftHand.setAttribute('hand-controls', 'right')
    el.appendChild(rightHand)

    const laser = document.createElement('a-entity')
    laser.setAttribute('laser-controls', 'hand: left')
    el.appendChild(laser)

    const plane = document.createElement('a-plane')
    plane.setAttribute('height', 100)
    plane.setAttribute('width', 100)
    plane.setAttribute('rotation', '-90 0 0 ')
    plane.setAttribute('color', '#333333')
    el.appendChild(plane)

    const sky = document.createElement('a-sky')
    sky.setAttribute('color', '#6EBAA7')
    el.appendChild(sky)

    document.getElementById('root').appendChild(el)
    this.el = el
  }

  clickedAnywhere = (e) => {
    const scene = document.getElementById("scene")
    if (e.target === scene) {
      return
    }

    if (!(scene.components && scene.components.raycaster)) {
      return
    }

    if (e.isTrusted) {
      // TODO: Proper 'click'. Could be sky. Handle dialog. Think through the ramifications for edit.
    }

    if (this.state.mode === Mode.PLAY) {
      this.handlePlayClick(e, scene)
    } else if (this.state.mode === Mode.EDIT) {
      this.handleEditClick(e, scene)
    }
  }

  handleEditClick(e, scene) {
    if (e.isTrusted) return

    if (this.state.holding) {
      this.dropBillboard()
    } else {
      let intersectedEls = scene.components.raycaster.intersectedEls || []
      if (intersectedEls.length === 0) {
        return
      } else if (intersectedEls.length > 1 ) {
        console.log("OOPS OOPS OOPS HAD MORE THAN ONE INTERSECTED EL", intersectedEls)
      }

      const el = intersectedEls[0]
      if (el.tagName !== 'A-IMAGE') {
        return
      }

      const object = this.state.objects[el.id]
      this.pickUp(object)
    }
  }

  handlePlayClick(e, scene) {
    var oldTextObj = this.state.textObj

    if (this.state.text !== undefined) {
      this.hideText()
    }

    let intersectedEls = scene.components.raycaster.intersectedEls || []
    for (var i = 0; i < intersectedEls.length; i++) {
      let el = intersectedEls[i];
      this.tryToShowDialog(el, oldTextObj)
    }
  }

  tryToShowDialog(el, oldTextObj) {
    if (el === oldTextObj) return

    let obj = this.state.objects[el.id]
    if (!(obj && obj.text)) return

    const position = el.getAttribute('position')
    const cameraPos = document.querySelector("#rig").getAttribute('position')

    if (cameraPos.x !== undefined) {
      const distance = Math.sqrt(
        Math.pow(position.x - cameraPos.x, 2) +
        Math.pow(position.z - cameraPos.z, 2)
      )

      if (distance < 3) {
        this.setText(obj.text)
      }
    }
  }

  // TODO: I don't know what this means.
  toBillboard(obj) {
    const newObj = {
      geometry: {
        width: obj.width,
        height: obj.height
      },
      material: {
        transparent: true,
        alphaTest: 0.5
      },
      ...obj
    }

    // TODO: lol?
    if (obj.image) {
      newObj.material.src = obj.image
    } else if (obj.animation) {
      // TODO: This should really be a separate Aframe plugin that uses the Three.js lifecycle
      newObj.material.src = obj.animation.images[obj.animation.currentFrame]
    }

    return newObj
  }

  billboardToEntity(o) {
    var el = document.createElement('a-image');
    Object.keys(o).forEach((key) => {
      el.setAttribute(key, o[key])
    })

    if (o.image) {
      el.setAttribute('material', {src: o.image })
    } else if (o.animation) {
      // TODO: This should really be a separate Aframe plugin that uses the Three.js lifecycle
      el.setAttribute('material', {src: o.animation.images[o.animation.currentFrame] })
    }

    el.setAttribute('image')

    return el
  }

  setText(text) {

  }

  hideText() {

  }

  addBillboard(billboard) {

  }

  removeBillboard(billboard) {

  }

  pickUp(billboard) {
    const holding = {...billboard}
    delete holding.rotation

    const objects = {...this.state.objects}
    delete objects[billboard.id]
  }

  dropBillboard() {
    const holdingObject3D = document.querySelector("#holding").object3D

    const holding = this.state.holding
    const objects = {...this.state.objects,
      [holding.id]: {...holding,
        position: holdingObject3D.getWorldPosition(),
        rotation: document.querySelector("#camera").getAttribute('rotation') // TODO: get from Object3D?
      }
    }
    // TODO: Actually set
  }

  /*
  render() {
    var images = [
      ["wol", "WoL.png"],
      ["wol2", "WoL2.png"]
    ]

    var sceneObjects = []
    for (var key in this.state.objects) {
      var o = this.state.objects[key]
      var billboard = this.toBillboard(o)
      sceneObjects.push(this.billboardToEntity(billboard))
    }

    var sceneImages = images.map(function(arr) {
      var [id, src] = arr
      return (<img id={id} key={id} src={src} />)
    })

    var text;
    if (this.state.text) {
      text = <Entity
        text={{value: this.state.text, width: 2.0, align: "center"}}
        position="0 -0.5 -0.8"
      />
    }

    var cursor;
    if (this.state.mode === Mode.EDIT && !!this.state.holding) {
      const obj = this.state.holding

      const holdingBillboard = this.toBillboard(obj)
      holdingBillboard.material.opacity = 0.5
      holdingBillboard.id = "holding"
      holdingBillboard.position = {x: 0, y: 0, z: -1.0}

      cursor = this.billboardToEntity(holdingBillboard)
    } else {
      cursor = <a-entity
        position="0 0 -1"
        geometry="primitive: ring; radiusInner: 0.005; radiusOuter: 0.01"
        material="color: black; shader: flat"
      />
    }

    return (
      <Scene id="scene"
        cursor="rayOrigin: mouse"
        events={{click: this.clickedAnywhere }}
      >
        <a-assets>
          {sceneImages}
        </a-assets>
        <Entity id="rig"
          movement-controls={`fly: ${this.state.mode === Mode.EDIT}`}
          position="0 0 0">
          <Entity id="camera"
            camera
            look-controls="pointer-lock-enabled: true"
            position="0 1.6 0"
          >
            {text}
            {cursor}
          </Entity>
        </Entity>

        <a-entity hand-controls="left"></a-entity>
        <a-entity hand-controls="right"></a-entity>
        <a-entity laser-controls="hand: left"></a-entity>

        <Entity primitive="a-plane" height="100" width="100" rotation="-90 0 0" color="#333333"/>
        <Entity primitive="a-sky" color="#6EBAA7"/>
        {sceneObjects}
      </Scene>
    );
  }
  */
}

export default App