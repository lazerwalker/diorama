import 'aframe';
import {Entity, Scene} from 'aframe-react';
import React from 'react';

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
        position: {x: 0, y: 0, z: -5},
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
          {sceneObjects}
        </Scene>
      </div>
    );
  }
}

export default App