import 'aframe';
import {Entity, Scene} from 'aframe-react';
import React from 'react';

class App extends React.Component {
  render () {
    return (
      <div>
        <img id='wol' src="WoL.png"/>
        <Scene>
          <Entity geometry={{primitive: 'plane'}} material={{src: '#wol'}} position={{x: 0, y: 0, z: -5}} width={1} height={1}/>
        </Scene>
      </div>
    );
  }
}

export default App