import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Model from './Model';


const useEventListener = (eventName, handler, element = window) => {
  const savedHandler = useRef();

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const eventListener = (event) => savedHandler.current(event);
    element.addEventListener(eventName, eventListener);
    return () => {
      element.removeEventListener(eventName, eventListener);
    };
  }, [eventName, element]);
};


const allowedPrimary = (keyCode) => {
   return [0, 32, 38].includes(keyCode)
}

const isShiftKey = (keyCode) => {
   return 16 == keyCode;
}


// caminar           38                   ['walk']
// correr            38S                  ['run']
// saltar            32                   ['jump']
// quedarse parado   null                 ['stand']
// caminar y saltar  38 => 38,32 => 38    ['run', 'jump']
// caminar saltando  38,32                ['walk', 'jump']
// correr y saltar   38S =>  70S => 38S
// correr saltando   70S
const getActions = (keysStatus) => {
   let code = 0;
   let shift = false;
   for(const keyCode in keysStatus){
      shift = shift || keysStatus[keyCode].shift
      if(keysStatus[keyCode].active)
         code += parseInt(keyCode);
   }
   if(code == 32) return ["jump"]
   if(code == 38 && !shift) return ["walk"]
   if(code == 38 && shift) return ["run"]
   if(code == 70 && !shift) return ["walk", "jump"]
   if(code == 70 && shift) return ["run", "jump"]
   if(code == 0) return ["stand"]
}


export default function App() {

   const [activeActions, setActiveActions] = useState('stand');
   const [keysStatus, setKeysStatus] = useState({
      0: {active: true, shift: false},
      32: {active: false, shift: false},
      38: {active: false, shift: false}
   }) // {32: {active: true, shift: true}}

   const updateKeysStatus = (code, active, shiftKey) => {
      const keysStatusClone = {...keysStatus};
      keysStatusClone[code] = {active: active, shift: shiftKey};
      setKeysStatus(keysStatusClone);
   }

   const updateShifStatus = (isActive) => {
      const keysStatusClone = {...keysStatus};
      for(const key in keysStatusClone){
         keysStatusClone[key].shift = isActive;
      }
      setKeysStatus(keysStatusClone);
   }  

   const handleKeydown = (e) => {
      const code = e.keyCode;
      if(isShiftKey(code)){
         updateShifStatus(true)
      }
      if(allowedPrimary(code) && !keysStatus[code].active){
         updateKeysStatus(code, true, e.shiftKey)
      }
   }

   const handleKeyup = (e) => {
      const code = e.keyCode;
      if(isShiftKey(code)){
         updateShifStatus(false)
      }
      if(allowedPrimary(code) && keysStatus[code].active){
         updateKeysStatus(code, false, e.shiftKey)
      }
   }
   
   useEventListener("keydown", handleKeydown);
   useEventListener("keyup", handleKeyup);

   useEffect(() => {
      const actions = getActions(keysStatus);
      setActiveActions(actions)
   }, [keysStatus])

   return (
      <Canvas
         camera={ {fov: 50, near: 0.1, far: 1000, position: [0, 5, -5]} }
         style={{
            backgroundColor: '#111a21',
            width: '100vw',
            height: '100vh',
         }}
      >
         <ambientLight intensity={1.25} />
         <directionalLight intensity={0.4} />
         <Suspense fallback={null}>
            <Model currentActions={activeActions} defaultActions={['stand']} position={[0, 0, 0]} />
         </Suspense>
         <OrbitControls />
      </Canvas>
   );
}