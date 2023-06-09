# MotionMark Governance Policy

MotionMark uses multistakeholder governance. This allows participating organizations to collaborate and
develop the benchmark with the goal of maintaining and developing the benchmark to represent rendering-
related workloads on the web. This also provides a structure that can endure to provide maintenance and
adapt to the future web.

An eligible “browser project” is a core end-to-end web browser engine with an integrated JavaScript engine
which distributes implementations widely. The project may delegate decision making within MotionMark
to multiple representatives (for example, to review code commits or to provide consensus for major changes).
The participating browser projects at this time are [Blink](https://www.chromium.org/blink/),
[Gecko](https://developer.mozilla.org/en-US/docs/Glossary/Gecko), and [WebKit](https://webkit.org).
Additions to this list can be proposed via filing an issue in this GitHub repository, and additions to this
list count as a Major change (described below).

The intent is that the working team should be able to move quickly for most changes,
with a higher level of process and consensus expected based on the impact of the change. The working team
consists of the contributors to MotionMark, and their respective browser projects.

-   **Trivial change** - This is a change that has no effect on the official benchmark and includes changes
    to whitespaces, comments, documentation outside policies and governance model, and unofficial test cases.
    A trivial change requires approval by a reviewer, who is not the author of the change,
    from one of the participating browser projects. The current reviewership policies for the participating
    browser projects can be found
    [here](https://chromium.googlesource.com/chromium/src/+/master/docs/code_reviews.md),
    [here](https://wiki.mozilla.org/Firefox/Code_Review), and
    [here](https://webkit.org/commit-and-review-policy/).
    The intent is to ensure basic code quality & license compatibility, not to reach agreement.
    For example, one participating browser project might be both writing and reviewing a new benchmark in
    a subfolder to test in their own CI, or reviewing code written by an external contributor.
-   **Non-trivial change** - This is a change that has small impact on the official benchmark and includes
    changes to official test cases, test runners, bug fixes, and the appearance of the benchmark.
    A non-trivial change requires approval by at least two of the participating browser projects
    (including either authoring or reviewing the change) and none other strongly opposed to the change
    within 10 business days.
-   **Major change** - This is a change that has major implications on the official benchmark such as
    releasing of a new version of the benchmark or any revisions to governance policies and processes,
    including changes to the participating browser projects.
    A major change requires a consensus, meaning approvals by each of the participating browser projects.

This governance policy and associated code will be hosted inside the MotionMark repository within
the WebKit GitHub organization under the 2-clause BSD license.
