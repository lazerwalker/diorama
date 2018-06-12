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
      let newFrame = obj.animation.currentFrame + 1
      if (newFrame >= obj.animation.images.length) { newFrame = 0; }

      let newAnimation = {...obj.animation, currentFrame: newFrame}
      let newObj = {...obj, animation: newAnimation}
      let newObjects = {...that.state.objects, wol: newObj}
      that.setState({objects: newObjects})
    }, interval)
  }

  clickedAnywhere(e, scene) {
    if (e.target === document.getElementById("scene")) {
      return
    }

    if (!(scene.components && scene.components.raycaster)) { 
      return
    }

    if (e.isTrusted) {
      // TODO: Proper 'click'. Could be sky. Handle dialog. Think through the ramifications for edit.
    }

    console.log("Clicked anywhere", e)

    if (this.state.mode === Mode.PLAY) {
      this.handlePlayClick(e, scene)
    } else if (this.state.mode === Mode.EDIT) {
      this.handleEditClick(e, scene)
    }
  }

  handleEditClick(e, scene) {
    if (e.isTrusted) return

    const cameraPos = document.querySelector("#rig").getAttribute('position')

    if (!!this.state.holding) {
      const holdingPos = document.querySelector("#holding").getAttribute('position')    

      // TODO: Position doesn't take mouse cursor into account

      const holding = this.state.holding
      const objects = {...this.state.objects, 
        [holding.id]: {
          id: holding.id,
          primitive: "a-image",
          geometry: {
            width: holding.width,
            height: holding.height
          },
          material: {
            transparent: true,
            alphaTest: 0.5
          },
          position: {
            x: cameraPos.x + holdingPos.x,
            y: cameraPos.y + holdingPos.y + holding.height/2,
            z: cameraPos.z + holdingPos.z
          },
          text: holding.text,
          image: holding.image
        }
      }
      this.setState({objects, holding: undefined})
      console.log("Undoing the holding")
    } else {
      let intersectedEls = scene.components.raycaster.intersectedEls || []
      if (intersectedEls.length > 1 ) {
        console.log("OOPS OOPS OOPS HAD MORE THAN ONE INTERSECTED EL", intersectedEls)
      }

      const el = intersectedEls[0]
      const object = this.state.objects[el.id]

      const holding = {
        id: object.id,
        image: object.image,
        animation: object.animation,
        width: object.geometry.width,
        height: object.geometry.height,
      }
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
      width: 1.5,
      height: 1.5,
      text: "Woah, I was placed!"
    },
    objects: {
      "wol": {
        id: 'wol',
        primitive: "a-image",
        geometry: {
          width: 1,
          height: 1
        },
        material: {
          transparent: true,
          alphaTest: 0.5
        },
        position: {x: 0.0, y: 1.0, z: -5.0},
        text: "Howdy pardner!",
        animation: {
          images: ["#wol", "#wol2"],
          framerate: 300,
          currentFrame: 1
        }
      }
    }
  }

  render() {
    var images = [
      ["wol", "WoL.png"],
      ["wol2", "WoL2.png"]
    ]

    var sceneObjects = []
    for (var key in this.state.objects) {
      var o = this.state.objects[key]

      if (o.image) {
        o.material.src = o.image
      } else if (o.animation) {
        // TODO: This should really be a separate Aframe plugin that uses the Three.js lifecycle
        o.material.src = o.animation.images[o.animation.currentFrame]
      }

      sceneObjects.push(<Entity key={o.id}
        primitive={o.primitive}
        geometry={o.geometry}
        material={o.material}
        position={o.position}
        events={o.events}
        id={o.id}
        // look-at="[camera]"
      />)
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
      holding = <Entity 
        primitive="a-image"
        geometry={{
          width: obj.width,
          height: obj.height
        }}
        material={{
          transparent: true,
          opacity: 0.5,
          alphaTest: 0.5,
          src: obj.image
        }}
        id="holding"
        position={{
          x: 0,
          y: 0,
          z: -1.0
        }}
      />

    }

    var that = this;
    return (
      <Scene id="scene" cursor="rayOrigin: mouse" events={{click: function(e) { that.clickedAnywhere(e, this) }}}>
        <a-assets>
          {sceneImages}
        </a-assets>
        <Entity id="rig"
          movement-controls
          position="0 0 0">
          <Entity camera
            position="0 1 0"
            look-controls >
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