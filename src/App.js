import 'aframe';
import {Entity, Scene} from 'aframe-react';
import React from 'react';

// TODO: Remvoe aframe-react.
// See how the default event system works in terms of clicking on things, and if I can get the behavior I want of "click on anything = remove text"
require('aframe-extras');
require('aframe-look-at-component')

const Mode = {
  EDIT: "edit",
  PLAY: "play"
}

class App extends React.Component {
  componentDidMount() {
    var that = this // TODO: Shouldn't be necessary?

    const interval = Math.min(...Object.values(this.state.objects)
        .map((o) => o.animation ? o.animation.framerate : Infinity))
    setInterval(() => {
      const obj = that.state.objects["wol"]
      if (obj) {
        let newFrame = obj.animation.currentFrame + 1
        if (newFrame >= obj.animation.images.length) { newFrame = 0; }

        let newAnimation = {...obj.animation, currentFrame: newFrame}
        let newObj = {...obj, animation: newAnimation}
        let newObjects = {...that.state.objects, wol: newObj}
        that.setState({objects: newObjects})
      }

      if (that.state.holding && that.state.holding.animation) {
        let holding = that.state.holding
        let newFrame = holding.animation.currentFrame + 1
        if (newFrame >= holding.animation.images.length) { newFrame = 0; }

        let newAnimation = {...holding.animation, currentFrame: newFrame}
        let newObj = {...holding, animation: newAnimation}
        that.setState({holding: newObj})
      }
    }, interval)
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
      const holdingObject3D = document.querySelector("#holding").object3D

      const holding = this.state.holding
      const objects = {...this.state.objects,
        [holding.id]: {...holding,
          position: holdingObject3D.getWorldPosition(),
          rotation: document.querySelector("#camera").getAttribute('rotation') // TODO: get from Object3D?
        }
      }

      this.setState({objects, holding: undefined})
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

      const holding = {...object}
      delete holding.rotation

      const objects = {...this.state.objects}
      delete objects[object.id]
      this.setState({objects, holding})
    }
  }

  handlePlayClick(e, scene) {
    var oldTextObj = this.state.textObj

    if (this.state.text !== undefined) {
      this.setState({text: undefined, textObj: undefined})
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
        this.setState({objects: this.state.objects, text: obj.text, textObj: el})
      }
    }
  }

  state = {
    mode: Mode.EDIT,
    holding: {
      id: 'wol2',
      image: "#wol2",
      width: 1.4,
      height: 1.6,
      text: "Woah, I was placed!"
    },
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
      }
    }
  }

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
      primitive: "a-image",
      ...obj
    }

    if (obj.image) {
      newObj.material.src = obj.image
    } else if (obj.animation) {
      // TODO: This should really be a separate Aframe plugin that uses the Three.js lifecycle
      newObj.material.src = obj.animation.images[obj.animation.currentFrame]
    }

    return newObj
  }

  billboardToEntity(o) {
   return <Entity key={o.id}
      primitive={o.primitive}
      geometry={o.geometry}
      material={o.material}
      position={o.position}
      rotation={o.rotation}
      events={o.events}
      id={o.id}
      // look-at="[camera]"
    />
  }

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

    var holding;
    if (this.state.mode === Mode.EDIT && !!this.state.holding) {
      const obj = this.state.holding

      const holdingBillboard = this.toBillboard(obj)
      holdingBillboard.material.opacity = 0.5
      holdingBillboard.id = "holding"
      holdingBillboard.position = {x: 0, y: 0, z: -1.0}

      holding = this.billboardToEntity(holdingBillboard)
    }

    return (
      <Scene id="scene" cursor="rayOrigin: mouse" events={{click: this.clickedAnywhere }}>
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
            {holding}
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
}

export default App