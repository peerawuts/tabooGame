const SelectWords = () => {
  return (
    // Div container with column class for styling
    <div className="column">
      <label>{`Select Words Category`}</label>
        <select value={selectedWordsCategory} onChange={(e) => setselectedWordsCategory(e.target.value)}>
            <option value="">Select Category</option>
                {categories.map((category) => (
            <option key={category} value={category}>
                {category}
            </option>
        ))}
        </select>
    </div>
  );
};

// Export the Select component as default
export default SelectWords;