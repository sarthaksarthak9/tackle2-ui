import { Application } from "@app/api/models";

describe("AppTable", () => {
  it.skip("Renders without crashing", () => {
    const application: Application = {
      id: 1,
      name: "myApp",
      description: "myDescription",
      migrationWave: null,
    };

    // const assessment: Assessment = {
    //   applicationId: 1,
    //   status: "COMPLETE",
    //   questionnaire: {
    //     categories: [
    //       {
    //         id: 1,
    //         order: 1,
    //         questions: [],
    //         title: "title1",
    //         comment: "comments1",
    //       },
    //       {
    //         id: 2,
    //         order: 2,
    //         questions: [],
    //         title: "title2",
    //         comment: "comments2",
    //       },
    //       {
    //         id: 3,
    //         order: 3,
    //         questions: [],
    //         title: "title3",
    //         comment: "comments3",
    //       },
    //     ],
    //   },
    // };
    // const wrapper = render(
    //   <ApplicationDetails application={application} assessment={assessment} />
    // );
    // expect(wrapper).toMatchSnapshot();
  });
});
