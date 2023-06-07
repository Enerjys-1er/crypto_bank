const fs = require('fs');
const path = require('path');
console.log(__dirname);

const webpackConfigPath = path.join(
    
    __dirname,
  '../node_modules',
  'react-scripts',
  'config',
  'webpack.config.js'
);

const fallbackConfig = `
    fallback: {
        "stream": require.resolve("stream-browserify"),
        "crypto": require.resolve("crypto-browserify")
    },
`;

fs.readFile(webpackConfigPath, 'utf8', (err, data) => {
  if (err) {
    throw err;
  }

  const fallbackRegex = /fallback\s*:\s*{[^}]*},\n/m;
  if (fallbackRegex.test(data)) {
    console.log('Fallback configuration already exists in webpack.config.js');
  } else {
    const resolveRegex = /resolve\s*:\s*{\s*$/m;
    const match = data.match(resolveRegex);
    if (match) {
      const insertIndex = match.index + match[0].length;
      const updatedData = `${data.slice(0, insertIndex)}${fallbackConfig}${data.slice(insertIndex)}`;

      fs.writeFile(webpackConfigPath, updatedData, 'utf8', (err) => {
        if (err) {
          throw err;
        }

        console.log('Fallback configuration added to webpack.config.js');
      });
    } else {
      console.error('Unable to find "resolve" configuration in webpack.config.js');
    }
  }
});