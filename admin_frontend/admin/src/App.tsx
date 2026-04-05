import { Routes, Route, Navigate } from "react-router-dom";
import Layout     from "./components/layout/Layout";
import Dashboard  from "./pages/Dashboard";
import Languages  from "./pages/Languages";
import Topics     from "./pages/Topics";
import TopicEditor from "./pages/TopicEditor";
import Diagrams   from "./pages/Diagrams";
import Quizzes    from "./pages/Quizzes";
import Cache      from "./pages/Cache";
import BulkInsert from "./pages/BulkInsert";
import DeletePage from "./pages/DeletePage";
import PaidContent from "./pages/PaidContent";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/"              element={<Dashboard />}   />
        <Route path="/languages"     element={<Languages />}   />
        <Route path="/topics"        element={<Topics />}      />
        <Route path="/topics/new"    element={<TopicEditor />} />
        <Route path="/topics/edit/*" element={<TopicEditor />} />
        <Route path="/diagrams"      element={<Diagrams />}    />
        <Route path="/quizzes"       element={<Quizzes />}     />
        <Route path="/cache"         element={<Cache />}       />
        <Route path="/bulk"          element={<BulkInsert />}  />
        <Route path="/delete"        element={<DeletePage />}  />
        <Route path="/paid"          element={<PaidContent />} />
        <Route path="*"              element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
