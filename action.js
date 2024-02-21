const Jira = require('./common/net/Jira')
const core = require('@actions/core')

const issueIdRegEx = /([a-zA-Z0-9]+-[0-9]+)/g

const eventTemplates = {
  branch: '{{event.ref}}',
  commits: "{{event.commits.map(c=>c.message).join(' ')}}",
}

module.exports = class {
  constructor ({ githubEvent, argv, config }) {
    this.Jira = new Jira({
      baseUrl: config.baseUrl,
      token: config.token,
      email: config.email,
    })

    this.config = config
    this.argv = argv
    this.githubEvent = githubEvent
  }

  async execute() {
    console.log("Executing action...")
    if (this.argv.string) {
      const foundIssue = await this.findIssueKeyIn(this.argv.string)

      if (foundIssue) return foundIssue
    }

    console.log("Looking for issue key in from...")
    if (this.argv.from) {
      const searchStr = this.getSearchString(this.argv.from)
      const foundIssue = await this.findIssueKeyIn(searchStr)

      if (foundIssue) return foundIssue
    }
  }

  async findIssueKeyIn(searchStr) {
    console.log("Looking for issue key in: ", searchStr)
    const match = searchStr.match(issueIdRegEx)

    console.log(`Searching in string: \n ${searchStr}`)

    if (!match) {
      console.log(`String does not contain issueKeys`)

      return
    }

    for (const issueKey of match) {
      console.log("Checking issue key exists in Jira: ", issueKey)
      const issue = await this.Jira.getIssue(issueKey)

      if (issue) {
        return { issue: issue.key }
      }
    }
  }

  getSearchString(from) {
    // console.log("The event is ", JSON.stringify(this.githubEvent, null, 4))
    if (from === "branch") {
      return this.githubEvent.pull_request.head.ref
    } else if (from === "commits") {
      console.log("TODO: we don't really support checking commits right now, using branch instead")
      return this.githubEvent.pull_request.head.ref //was commits.map(c=>c.message).join(' ')
    } else {
      throw new Error('Unsupported source to find issue key in: ' + from);
    }
  }
}
