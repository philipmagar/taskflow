const suspiciousPatterns = [
  /<script>/i,
  /SELECT.*FROM/i,
  /DROP TABLE/i,
  /INSERT INTO/i,
  /--/,
  /OR 1=1/i,
];

exports.detectSuspiciousInput = (input) => {
  if (!input) return false;

  // Convert objects/arrays to string for comprehensive pattern matching
  const inputStr = typeof input === 'string' ? input : JSON.stringify(input);

  return suspiciousPatterns.some((pattern) =>
    pattern.test(inputStr)
  );
};