import 'aframe';
import {Entity, Scene} from 'aframe-react';
import React from 'react';

require('aframe-extras');
require('aframe-look-at-component')

class App extends React.Component {
  handleClick = (e) => {
    const position = e.target.getAttribute('position')
    const cameraPos = document.querySelector("#rig").getAttribute('position')

    const distance = Math.sqrt(
      Math.pow(position.x - cameraPos.x, 2) +
      Math.pow(position.z - cameraPos.z, 2)
    )

    if (distance >= 3) { return }

    const newPos = {
      x: cameraPos.x,
      y: cameraPos.y + 1.2,
      z: cameraPos.z - 0.2
    }
    const newObjects = this.state.objects
    newObjects.push({
      id: 'hello',
      text: {
        value: "howdy pardner!",
        width: 2.0,
        align: "center"
      },
      position: newPos
    });

    this.setState({objecets: newObjects})
    console.log("HOWDY PARDNER")
  }

  state = {
    objects: [
      {
        id: 'wol',
        primitive: "a-image",
        geometry: {
          width: 1,
          height: 1
        },
        material: {
          src: "#wol",
          transparent: true,
          alphaTest: 0.5
        },
        position: {x: 0.0, y: 1.0, z: -5.0},
        events: {
          click: this.handleClick
        }
      }
    ]
  }

  render () {
    var images = [
      ["wol", "WoL.png"]
    ]

    var sceneObjects = this.state.objects.map(function(o) {
      return (<Entity key={o.id}
        primitive={o.primitive}
        geometry={o.geometry}
        material={o.material}
        position={o.position}
        events={o.events}
        text={o.text}
        look-at="[camera]"
      />)
    })

    var sceneImages = images.map(function(arr) {
      var [id, src] = arr
      return (<img id={id} key={id} src={src} />)
    })

    return (
      <Scene cursor="rayOrigin: mouse">
        <a-assets>
          {sceneImages}
        </a-assets>
        <Entity id="rig"
          movement-controls
          position="0 0 0">
          <Entity camera
            position="0 1 0"
            look-controls></Entity>
        </Entity>

        <a-entity hand-controls="left"></a-entity>
        <a-entity hand-controls="right"></a-entity>
        <a-entity laser-controls="hand: left"></a-entity>

        <Entity primitive="a-plane" height="100" width="100" rotation="-90 0 0" color="#333333"/>
        <Entity primitive="a-sky" color="#6EBAA7" />
        {sceneObjects}
      </Scene>
    );
  }
}

export default App