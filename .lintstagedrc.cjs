// lint-staged uses a function for *.md so that files already excluded
// in .markdownlint-cli2.jsonc (blog, api, plans, etc.) are filtered out
// BEFORE being passed as positional args — markdownlint-cli2 ignores[]
// only apply during glob discovery, not to explicit absolute paths.
const MARKDOWNLINT_IGNORE = [
  /\/docs\/blog\//,
  /\/docs\/docs\/api\//,
  /\/docs\/api\//,
  /\/plans\//,
  /\/specs\//,
  /\/\.claude\//,
  /\/skills\//,
  /\/agents\//,
  /\/prompts\//,
  /\/temp\//,
  /\/examples\//,
  /\/docs\/internal\//,
  /\/node_modules\//,
  /PRAMAN_CODE_REVIEW\.md$/,
];

/** @param {string[]} files */
function mdlint(files) {
  const lintable = files.filter(
    (f) => !MARKDOWNLINT_IGNORE.some((re) => re.test(f)),
  );
  return lintable.length ? [`markdownlint-cli2 ${lintable.join(' ')}`] : [];
}

module.exports = {
  '*.ts': [
    "eslint --fix --max-warnings=0 --no-warn-ignored --rule 'praman/no-deprecated-ui5-globals: off' --rule 'praman/no-deprecated-ui5-api: off'",
    'prettier --write',
  ],
  '*.{json,md,yml,yaml}': ['prettier --write'],
  '*.md': mdlint,
};
