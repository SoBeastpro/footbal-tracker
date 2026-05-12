import { useState } from 'react'
import './App.css'

function MyApp(){
  const [count, setCount] = useState(0);

  function handleClick() {
    setCount(count + 1);
  }

  return(
    <MyButton count = {count} onClick = {handleClick}/>
  )
  
}
function MyButton({count, onClick}) {
    return (
      <div className='ButtonContainer'>
        <button onClick={onClick} className="MyButton">
          Clicked {count} times
        </button>
      </div>
    );
  }

export default MyApp
