import React from "react";
import UseCopy1 from "./test/UseCopy1";
import Playground from "./test/Playground";
import Playground2 from "./test/Playground2";
import Playground3 from "./test/Playground3";
import Playground4 from "./test/Playground4";
import Playground5 from "./test/Playground5";
import Playground6 from "./test/Playground6";
import Playground7 from "./test/Playground7";
import Playground8 from "./test/Playground8";
import Playground9 from "./test/Playground9";
import CopyMachine from "./CopyMachine";

const App = () => {
    const backlogsToCopy = [28939, 28894, 28945];

    const sprintNumber = 272;

    const iterateOnListOfBacklogs = () => {
        return backlogsToCopy.map((id) => (
            <CopyMachine key={id} workItemId={id} sprintNumber={sprintNumber} />
        ));
    };

    return (
        <div>
            <h1>hi</h1>
            {/* <UseCopy1 /> */}
            {/* <Playground /> */}
            {/* <Playground2 /> */}
            {/* <Playground3 workItemId={28751} /> */}
            {/* <Playground3 workItemId={28491} /> */}
            {/* <Playground4 workItemId={28751} /> */}
            {/* <Playground5 workItemId={28751} /> */}
            {/* <Playground6 workItemId={28751} /> */}
            {/* <Playground7 workItemId={28751} /> */}
            {/* <Playground8 workItemId={28751} /> */}
            {/* <Playground9 /> */}
            {/* <CopyMachine workItemId={28894} sprintNumber={273} /> */}

            {iterateOnListOfBacklogs()}
        </div>
    );
};

export default App;
