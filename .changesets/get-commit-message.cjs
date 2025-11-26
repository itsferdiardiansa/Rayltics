function getCommitMessage(releasePlan) {
  console.log('release: ', releasePlan)
  const release = releasePlan.releases[0]

  if (!release) {
    return 'chore(release): version packages'
  }

  const { oldVersion, newVersion } = release

  return `chore(release): bump version ${oldVersion} to ${newVersion}`
}

module.exports = getCommitMessage
