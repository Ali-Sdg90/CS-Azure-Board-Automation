import React from "react";
import UseCopy1 from "./test/UseCopy1";
import Playground from "./test/Playground";
import Playground2 from "./test/Playground2";
import Playground3 from "./test/Playground3";
import Playground4 from "./test/Playground4";
import Playground5 from "./test/Playground5";

const App = () => {
    return (
        <div>
            <h1>hi</h1>
            {/* <UseCopy1 /> */}
            {/* <Playground /> */}
            {/* <Playground2 /> */}
            {/* <Playground3 workItemId={28751} /> */}
            {/* <Playground3 workItemId={28491} /> */}
            {/* <Playground4 workItemId={28751} /> */}
            <Playground5 workItemId={28751} />
        </div>
    );
};

export default App;
