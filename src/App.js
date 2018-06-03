import 'aframe';
import {Entity, Scene} from 'aframe-react';
import React from 'react';

// TODO: Remvoe aframe-react.
// See how the default event system works in terms of clicking on things, and if I can get the behavior I want of "click on anything = remove text"
require('aframe-extras');
require('aframe-look-at-component')

class App extends React.Component {
  componentDidMount = () => {
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
      that.setState({...that.state, objects: newObjects})
    }, interval)
  }

  clickedAnywhere = (e, scene) => {
    console.log("In clickedanywhere")
    if (!(scene.components && scene.components.raycaster)) { 
      return
    }
   
    var oldTextObj = this.state.textObj

    if (this.state.text !== undefined) {
      this.setState({text: undefined, textObj: undefined})
    }

    let intersectedEls = scene.components.raycaster.intersectedEls || []
    for (var i = 0; i < intersectedEls.length; i++) {
      let el = intersectedEls[i];
      this.handleClick(el, oldTextObj)
    }
  }

  handleClick = (el, oldTextObj) => {
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
      },
      "wol2": {
        id: 'wol2',
        primitive: "a-image",
        geometry: {
          width: 1.5,
          height: 1.5
        },
        material: {
          transparent: true,
          alphaTest: 0.5
        },
        position: {x: 3.0, y: 1.5, z: -10.0},
        text: "There's a snake in my boot!",
        image: "#wol"
      }
    }
  }

  render () {
    var images = [
      ["wol", "WoL.png"],
      ["wol2", "WoL2.png"]
    ]

    var sceneObjects = []
    for (var key in this.state.objects) {
      var o = this.state.objects[key]
      console.log(o.id)

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
        text={o.text}
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
      text = <Entity text={{value: this.state.text, width: 2.0, align: "center"}} position="0 -0.5 -0.8" />
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
          </Entity>
        </Entity>

        <a-entity hand-controls="left"></a-entity>
        <a-entity hand-controls="right"></a-entity>
        <a-entity laser-controls="hand: left"></a-entity>

        <Entity primitive="a-plane" height="100" width="100" rotation="-90 0 0" color="#333333"/>
        <Entity primitive="a-sky" color="#6EBAA7" events={{click: this.clickedAnywhere}}/>
        {sceneObjects}
      </Scene>
    );
  }
}

export default App