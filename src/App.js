import 'aframe';
import {Entity, Scene} from 'aframe-react';
import React from 'react';

class App extends React.Component {
  render () {
    return (
      <Scene>
        <Entity geometry={{primitive: 'box'}} material={{color: 'red'}} position={{x: 0, y: 0, z: -5}}/>
        <Entity text={{value: 'Hello, WebVR!'}} position={{x:0, y: 1, z: -4}} color={'blue'}/>
      </Scene>
    );
  }
}

export default App