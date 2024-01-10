import {Link, Route, Routes} from 'react-router-dom';
import Register from './Register';
import Login from './Login';

function App() {
  return (
    <div>
      <ul>
        <li>
          <Link to="/register">Register</Link>
        </li>
        <li>
          <Link to="/login">Login</Link>
        </li>
      </ul>
      <hr />
      <Routes>
        <Route path="/register" Component={Register} />
        <Route path="/login" Component={Login} />
      </Routes>
    </div>
  );
}

export default App;
