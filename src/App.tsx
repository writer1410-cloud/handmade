import { NavLink, Route, Routes } from "react-router-dom";
import Home from "./screens/Home";
import Materials from "./screens/Materials";
import WorkEdit from "./screens/WorkEdit";
import PriceSimulation from "./screens/PriceSimulation";
import Templates from "./screens/Templates";
import Settings from "./screens/Settings";

function BottomNav() {
  const tab = ({ isActive }: { isActive: boolean }) => (isActive ? "active" : "");
  return (
    <nav className="bottom-nav">
      <NavLink to="/" className={tab} end>
        <span className="ico">🏠</span>ホーム
      </NavLink>
      <NavLink to="/materials" className={tab}>
        <span className="ico">🧵</span>材料
      </NavLink>
      <NavLink to="/templates" className={tab}>
        <span className="ico">📋</span>テンプレート
      </NavLink>
      <NavLink to="/settings" className={tab}>
        <span className="ico">⚙️</span>設定
      </NavLink>
    </nav>
  );
}

export default function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/materials" element={<Materials />} />
        <Route path="/work/new" element={<WorkEdit />} />
        <Route path="/work/:id" element={<WorkEdit />} />
        <Route path="/work/:id/sim" element={<PriceSimulation />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
      <BottomNav />
    </div>
  );
}
