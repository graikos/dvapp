import React, {useEffect, useRef, useState} from 'react';
import "./NavigationBar.css"


function NavigationBar(props) {


  const handleAnimations  = () => {
    if (props.account){
      return <h3 className={"nav-header fade-in"}>Account connected: <span>{props.account}</span></h3>;
    }

    return <button className={"connect-account-button fade-in"} onClick={props.connectToAccount}>Connect Account</button>;
  };

  return (
    <nav>
      {
        handleAnimations()
      }
    </nav>
  );
}


export default NavigationBar;
