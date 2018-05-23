import 'aframe';
import {Entity, Scene} from 'aframe-react';
import React from 'react';
require('aframe-extras');

class App extends React.Component {
  render () {
    var objects = [
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
        position: {x: 0, y: 1, z: -5}
      }
    ]

    var images = [
      ["wol", "WoL.png"]
    ]

    var sceneObjects = objects.map(function(o) {
      return (<Entity key={o.id} primitive={o.primitive} geometry={o.geometry} material={o.material} position={o.position}/>)
    })

    var sceneImages = images.map(function(arr) {
      var [id, src] = arr
      return (<img id={id} key={id} src={src} />)
    })

    return (
      <Scene>
        <a-assets>
          {sceneImages}
        </a-assets>
        <Entity id="rig"
          movement-controls
          position="0 0 0">
          <Entity camera
            position="0 1 0"
            look-controls="pointerLockEnabled: true"></Entity>
        </Entity>

        <Entity primitive="a-plane" height="100" width="100" rotation="-90 0 0" color="#333333"/>
        <Entity primitive="a-sky" color="#6EBAA7" />
        {sceneObjects}
      </Scene>
    );
  }
}

export default App