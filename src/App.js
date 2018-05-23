import 'aframe';
import {Entity, Scene} from 'aframe-react';
import React from 'react';
require('aframe-extras');

class App extends React.Component {
  render () {
    var objects = [
      {
        geometry: {
          primitive: 'plane',
          width: 1,
          height: 1
        },
        material: {src: "#wol"},
        position: "1 1 1"
      }
    ]

    var images = [
      ["wol", "WoL.png"]
    ]

    var sceneObjects = objects.map(function(o) {
      return (<Entity geometry={o.geometry} material={o.material} position={o.position}/>)
    })

    var sceneImages = images.map(function(arr) {
      var [id, src] = arr
      return (<img id={id} src={src} />)
    })

    return (
      <div>
        {sceneImages}
        <Scene>
          <Entity id="rig"
            movement-controls
            position="0 0 0">
            <Entity camera
              position="0 1 0"
              look-controls="pointerLockEnabled: true"></Entity>
          </Entity>
          <a-plane height="100" width="100" rotation="-90 0 0" color="#333333"/>
          <a-sky color="#6EBAA7" />
          {sceneObjects}
        </Scene>
      </div>
    );
  }
}

export default App