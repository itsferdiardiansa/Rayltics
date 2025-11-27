const path = require('path')

module.exports = {
  '**/*.{js,jsx,ts,tsx,json,md}': filenames => {
    const relativeFiles = filenames
      .map(f => pathIpRelative(process.cwd(), f))
      .join(' ')

    return [
      `npx prettier --write ${relativeFiles}`,
      `npx eslint --fix ${filenames.map(f => `"${f}"`).join(' ')}`,
    ]
  },

  '**/*.{ts,tsx,js,jsx}': filenames => {
    return 'npx nx affected -t test --passWithNoTests'
  },

  '**/*.{ts,tsx}': () => {
    return 'npx tsc --noEmit'
  },
}

function pathIpRelative(cwd, file) {
  return path.relative(cwd, file)
}
