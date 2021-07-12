import * as React from "react"

function Child(props) {
  return React.Children.map(props.children, function (item) {
    return item
  })
}

class App extends React.Component {
  render() {
    return <div>
      1111
    </div>
  }
}

export default App
