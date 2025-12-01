import React, { useState } from 'react';
import Papa from 'papaparse';

const CSVUpload = ({ onUploadComplete }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [parseError, setParseError] = useState(null);
  const [selectedChartType, setSelectedChartType] = useState('gender');
  const [rawData, setRawData] = useState(null);
  
  // Store occupation and education data separately
  const [occupationData, setOccupationData] = useState(null);
  const [educationDataForOccupation, setEducationDataForOccupation] = useState(null);

  const handleFileUpload = (e, dataType) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setParseError(null);
    
    // For occupation chart, we need both files
    if (dataType === 'occupation') {
      setSelectedChartType('occupation');
    } else {
      setSelectedChartType(dataType);
    }

    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (results) => {
        console.log("=== CSV PARSE RESULTS ===");
        console.log("Total rows:", results.data.length);
        console.log("First 3 rows:", results.data.slice(0, 3));
        
        if (!results.data || results.data.length === 0) {
          setParseError('No data found in CSV file.');
          setUploading(false);
          return;
        }

        const firstRow = results.data[0];
        console.log("First row (should be headers):", firstRow);
        
        setRawData(results.data);
        let transformedData = [];
        
        // For occupation chart, store the data temporarily
        if (dataType === "occupation-occupation") {
          const parsed = parseOccupationTransposedFromArray(results.data);
          setOccupationData(parsed);
          
          // Check if we already have education data
          if (educationDataForOccupation) {
            transformedData = mergeOccupationEducationData(parsed, educationDataForOccupation);
            setPreview(transformedData);
          } else {
            setParseError('Occupation data uploaded. Please also upload Education data for the occupation chart.');
          }
          setUploading(false);
          return;
        } else if (dataType === "occupation-education") {
          const parsed = parseEducationTransposedFromArray(results.data);
          setEducationDataForOccupation(parsed);
          
          // Check if we already have occupation data
          if (occupationData) {
            transformedData = mergeOccupationEducationData(occupationData, parsed);
            setPreview(transformedData);
          } else {
            setParseError('Education data uploaded. Please also upload Occupation data for the occupation chart.');
          }
          setUploading(false);
          return;
        }
        
        // Use the pre-selected data type from file input
        if (dataType === "education") {
          transformedData = parseEducationTransposedFromArray(results.data);
        } else if (dataType === "age") {
          const firstRow = results.data[0];
          const hasYearHeaders = firstRow.slice(1).some(cell => /^\d{4}$/.test(String(cell).trim()));
          if (hasYearHeaders) {
            transformedData = parseAgeTransposedFromArray(results.data);
          }
        } else if (dataType === "geographic") {
          transformedData = parseGeographicDataFromArray(results.data);
        } else if (dataType === "total") {
          const firstRow = results.data[0];
          const hasYearHeaders = firstRow.slice(1).some(cell => /^\d{4}$/.test(String(cell).trim()));
          if (hasYearHeaders) {
            transformedData = parseTotalTransposedFromArray(results.data);
          } else {
            transformedData = parseTotalDataFromArray(results.data);
          }
        } else if (dataType === "gender") {
          transformedData = parseGenderDataFromArray(results.data);
        }
        
        if (transformedData.length === 0) {
          setParseError(`No valid processed data. Please check your CSV format.`);
        } else {
          setPreview(transformedData);
        }

        setUploading(false);
      },
      error: (error) => {
        setParseError('Error parsing CSV: ' + error.message);
        setUploading(false);
      }
    });
  };

  const parseGenderDataFromArray = (data) => {
    console.log("=== Parsing Gender Data from Array ===");
    
    const headers = data[0].map(h => String(h).trim().toLowerCase());
    console.log("Headers:", headers);
    
    const yearIdx = headers.findIndex(h => h.includes('year'));
    const maleIdx = headers.findIndex(h => h.includes('male') && !h.includes('female'));
    const femaleIdx = headers.findIndex(h => h.includes('female'));
    
    console.log("Column indices - Year:", yearIdx, "Male:", maleIdx, "Female:", femaleIdx);
    
    if (yearIdx === -1 || maleIdx === -1 || femaleIdx === -1) {
      console.log("Could not find required columns for gender data");
      return [];
    }
    
    return data.slice(1)
      .map(row => ({
        year: parseInt(row[yearIdx]),
        male: parseInt(row[maleIdx]) || 0,
        female: parseInt(row[femaleIdx]) || 0
      }))
      .filter(row => !isNaN(row.year));
  };

  const parseEducationTransposedFromArray = (data) => {
    console.log("=== Parsing Transposed Education Data ===");
    
    const headerRow = data[0];
    const yearCols = [];
    const yearIndices = [];
    
    headerRow.forEach((cell, idx) => {
      if (idx === 0) return;
      const trimmed = String(cell).trim();
      if (/^\d{4}$/.test(trimmed)) {
        yearCols.push(parseInt(trimmed));
        yearIndices.push(idx);
      }
    });
    
    console.log("Years found:", yearCols);
    
    const findRow = (variations) => {
      for (let row of data.slice(1)) {
        const categoryName = String(row[0] || '').trim().toLowerCase();
        for (let variation of variations) {
          if (categoryName === variation.toLowerCase()) {
            return row;
          }
        }
      }
      return null;
    };
    
    const rows = {
      elementaryL: findRow(["Elementary Level", "Elementary level"]),
      elementaryG: findRow(["Elementary Graduate", "Elementary graduate"]),
      hsL: findRow(["High School Level", "High school level"]),
      hsG: findRow(["High School Graduate", "High school graduate"]),
      collegeL: findRow(["College Level", "College level"]),
      collegeG: findRow(["College Graduate", "College graduate"]),
      pgL: findRow(["Post Graduate Level", "Postgraduate Level"]),
      pg: findRow(["Post Graduate", "Postgraduate"])
    };
    
    const clean = (val) => {
      if (val === undefined || val === null || val === '') return 0;
      const str = String(val).replace(/[^\d]/g, '');
      if (str === '') return 0;
      const num = parseInt(str);
      return isNaN(num) ? 0 : num;
    };
    
    const results = yearCols.map((year, idx) => {
      const colIndex = yearIndices[idx];
      
      const elementary = clean(rows.elementaryL?.[colIndex]) + clean(rows.elementaryG?.[colIndex]);
      const highSchool = clean(rows.hsL?.[colIndex]) + clean(rows.hsG?.[colIndex]);
      const college = clean(rows.collegeL?.[colIndex]) + clean(rows.collegeG?.[colIndex]);
      const postgraduate = clean(rows.pgL?.[colIndex]) + clean(rows.pg?.[colIndex]);
      
      return { year, elementary, highSchool, college, postgraduate };
    });
    
    console.log("First 3 parsed results:", results.slice(0, 3));
    return results;
  };

  const parseAgeTransposedFromArray = (data) => {
    console.log("=== Parsing Transposed Age Distribution Data ===");
    
    const headerRow = data[0];
    const yearCols = [];
    const yearIndices = [];
    
    headerRow.forEach((cell, idx) => {
      if (idx === 0) return;
      const trimmed = String(cell).trim();
      if (/^\d{4}$/.test(trimmed)) {
        yearCols.push(parseInt(trimmed));
        yearIndices.push(idx);
      }
    });
    
    console.log("Years found:", yearCols);
    
    if (yearCols.length === 0) {
      console.log("No year columns found");
      return [];
    }
    
    const clean = (val) => {
      if (val === undefined || val === null || val === '') return 0;
      const str = String(val).replace(/[^\d]/g, '');
      if (str === '') return 0;
      const num = parseInt(str);
      return isNaN(num) ? 0 : num;
    };
    
    const results = [];
    
    for (let yearIdx = 0; yearIdx < yearCols.length; yearIdx++) {
      const year = yearCols[yearIdx];
      const colIndex = yearIndices[yearIdx];
      
      for (let rowIdx = 1; rowIdx < data.length; rowIdx++) {
        const row = data[rowIdx];
        const ageGroup = String(row[0] || '').trim();
        
        if (!ageGroup || 
            ageGroup.toLowerCase() === 'not reported' || 
            ageGroup.toLowerCase().includes('no response')) {
          continue;
        }
        
        const count = clean(row[colIndex]);
        
        if (count > 0) {
          results.push({
            year,
            ageGroup,
            count
          });
        }
      }
    }
    
    console.log("First 10 parsed age results:", results.slice(0, 10));
    return results;
  };

  const parseTotalTransposedFromArray = (data) => {
    console.log("=== Parsing Transposed Total Data ===");
    
    const headerRow = data[0];
    const yearCols = [];
    const yearIndices = [];
    
    headerRow.forEach((cell, idx) => {
      if (idx === 0) return;
      const trimmed = String(cell).trim();
      if (/^\d{4}$/.test(trimmed)) {
        yearCols.push(parseInt(trimmed));
        yearIndices.push(idx);
      }
    });
    
    console.log("Years found:", yearCols);
    
    if (yearCols.length === 0) {
      return [];
    }
    
    const clean = (val) => {
      if (val === undefined || val === null || val === '') return 0;
      const str = String(val).replace(/[^\d]/g, '');
      if (str === '') return 0;
      const num = parseInt(str);
      return isNaN(num) ? 0 : num;
    };
    
    const results = yearCols.map((year, idx) => {
      const colIndex = yearIndices[idx];
      let total = 0;
      
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const ageGroup = String(row[0] || '').trim().toLowerCase();
        
        if (!ageGroup || ageGroup === 'not reported' || ageGroup.includes('no response')) {
          continue;
        }
        
        total += clean(row[colIndex]);
      }
      
      return { year, total };
    });
    
    console.log("First 5 parsed total results:", results.slice(0, 5));
    return results;
  };

  const parseTotalDataFromArray = (data) => {
    console.log("=== Parsing Total Data from Array ===");
    
    const headers = data[0].map(h => String(h).trim().toLowerCase());
    const yearIdx = headers.findIndex(h => h.includes('year'));
    const totalIdx = headers.findIndex(h => h.includes('total'));
    
    if (yearIdx === -1 || totalIdx === -1) {
      return [];
    }
    
    return data.slice(1)
      .map(row => ({
        year: parseInt(row[yearIdx]),
        total: parseInt(row[totalIdx]) || 0
      }))
      .filter(row => !isNaN(row.year) && !isNaN(row.total));
  };

  const parseGeographicDataFromArray = (data) => {
    console.log("=== Parsing Geographic Data from Array ===");
    
    const headerRow = data[0];
    console.log("Header row:", headerRow);
    
    const yearIdx = headerRow.findIndex(h => 
      String(h).trim().toUpperCase() === 'YEAR'
    );
    
    if (yearIdx === -1) {
      console.log("Could not find YEAR column");
      return [];
    }
    
    const countryColumns = [];
    for (let i = yearIdx + 1; i < headerRow.length; i++) {
      const colName = String(headerRow[i]).trim().toUpperCase();
      if (colName && colName !== 'TOTAL') {
        countryColumns.push({
          index: i,
          name: String(headerRow[i]).trim()
        });
      }
    }
    
    console.log("Found countries:", countryColumns.map(c => c.name));
    
    const results = [];
    
    for (let rowIdx = 1; rowIdx < data.length; rowIdx++) {
      const row = data[rowIdx];
      const year = parseInt(row[yearIdx]);
      
      if (isNaN(year)) continue;
      
      for (const country of countryColumns) {
        const count = parseInt(row[country.index]) || 0;
        
        if (count > 0) {
          results.push({
            year,
            country: country.name,
            count
          });
        }
      }
    }
    
    console.log("First 10 parsed geographic results:", results.slice(0, 10));
    return results;
  };

  const parseOccupationTransposedFromArray = (data) => {
    console.log("=== Parsing Transposed Occupation Data ===");
    
    const headerRow = data[0];
    const yearCols = [];
    const yearIndices = [];
    
    headerRow.forEach((cell, idx) => {
      if (idx === 0) return;
      const trimmed = String(cell).trim();
      if (/^\d{4}$/.test(trimmed)) {
        yearCols.push(parseInt(trimmed));
        yearIndices.push(idx);
      }
    });
    
    console.log("Years found:", yearCols);
    
    if (yearCols.length === 0) {
      console.log("No year columns found");
      return [];
    }
    
    const clean = (val) => {
      if (val === undefined || val === null || val === '') return 0;
      const str = String(val).replace(/[^\d]/g, '');
      if (str === '') return 0;
      const num = parseInt(str);
      return isNaN(num) ? 0 : num;
    };
    
    const results = [];
    
    for (let yearIdx = 0; yearIdx < yearCols.length; yearIdx++) {
      const year = yearCols[yearIdx];
      const colIndex = yearIndices[yearIdx];
      
      for (let rowIdx = 1; rowIdx < data.length; rowIdx++) {
        const row = data[rowIdx];
        const occupation = String(row[0] || '').trim();
        
        if (!occupation || 
            occupation.toLowerCase() === 'not reported' || 
            occupation.toLowerCase() === 'no occupation reported' ||
            occupation.toLowerCase().includes('no response')) {
          continue;
        }
        
        const count = clean(row[colIndex]);
        
        if (count > 0) {
          results.push({
            year,
            occupation,
            count
          });
        }
      }
    }
    
    console.log("First 10 parsed occupation results:", results.slice(0, 10));
    return results;
  };

  const mergeOccupationEducationData = (occupationData, educationData) => {
    console.log("=== Merging Occupation and Education Data ===");
    
    const merged = [];
    
    const educationByYear = {};
    educationData.forEach(item => {
      educationByYear[item.year] = {
        elementary: item.elementary || 0,
        highSchool: item.highSchool || 0,
        college: item.college || 0,
        postgraduate: item.postgraduate || 0
      };
    });
    
    occupationData.forEach(occItem => {
      const eduItem = educationByYear[occItem.year];
      
      if (eduItem) {
        const totalEducation = eduItem.elementary + eduItem.highSchool + eduItem.college + eduItem.postgraduate;
        
        merged.push({
          year: occItem.year,
          occupation: occItem.occupation,
          totalOccupation: occItem.count,
          totalEducation: totalEducation,
          elementary: eduItem.elementary,
          highSchool: eduItem.highSchool,
          college: eduItem.college,
          postgraduate: eduItem.postgraduate
        });
      }
    });
    
    console.log("First 10 merged results:", merged.slice(0, 10));
    return merged;
  };

  const handleConfirmUpload = () => {
    if (preview) {
      onUploadComplete(preview, selectedChartType);
      resetUpload();
    }
  };

  const resetUpload = () => {
    setPreview(null);
    setRawData(null);
    setParseError(null);
    setOccupationData(null);
    setEducationDataForOccupation(null);
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => input.value = '');
  };

  const handleCancel = () => resetUpload();

  return (
    <div style={{
      backgroundColor: '#fff',
      padding: 30,
      borderRadius: 8,
      marginBottom: 30
    }}>
      <h2 style={{ 
        marginBottom: 30, 
        marginTop: 0,
        color: '#1976d2',
        fontSize: 28,
        fontWeight: 600
      }}>Upload CSV Data</h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 20,
        marginBottom: 20
      }}>
        {[
          { label: 'Country Data:', type: 'geographic' },
          { label: 'Education Data:', type: 'education' },
          { label: 'Age Distribution Data:', type: 'age' },
          { label: 'Sex Distribution Data:', type: 'gender' },
          { label: 'Total Emigrants Data:', type: 'total' }
        ].map(({ label, type }) => (
          <div key={type}>
            <label style={{ 
              display: 'block', 
              marginBottom: 8,
              fontSize: 14,
              fontWeight: 500,
              color: '#333'
            }}>
              {label}
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => handleFileUpload(e, type)}
              disabled={uploading}
              style={{ 
                width: '100%',
                padding: '8px',
                fontSize: 14,
                border: '1px solid #ddd',
                borderRadius: 4
              }}
            />
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 20,
        padding: 20,
        backgroundColor: '#f0f7ff',
        borderRadius: 8,
        border: '2px solid #2196F3'
      }}>
        <h3 style={{ 
          margin: '0 0 15px 0', 
          color: '#1976d2',
          fontSize: 16 
        }}>
          Occupation Data (Requires 2 Files)
        </h3>
        <p style={{ 
          margin: '0 0 15px 0', 
          fontSize: 13, 
          color: '#666' 
        }}>
          Upload both Occupation and Education CSV files to create the occupation vs education scatter plot
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 20
        }}>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: 8,
              fontSize: 14,
              fontWeight: 500,
              color: '#333'
            }}>
              Occupation Data:
              {occupationData && <span style={{ color: '#4CAF50', marginLeft: 8 }}>✓ Uploaded</span>}
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => handleFileUpload(e, 'occupation-occupation')}
              disabled={uploading}
              style={{ 
                width: '100%',
                padding: '8px',
                fontSize: 14,
                border: '1px solid #ddd',
                borderRadius: 4
              }}
            />
          </div>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: 8,
              fontSize: 14,
              fontWeight: 500,
              color: '#333'
            }}>
              Education Data (for Occupation):
              {educationDataForOccupation && <span style={{ color: '#4CAF50', marginLeft: 8 }}>✓ Uploaded</span>}
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => handleFileUpload(e, 'occupation-education')}
              disabled={uploading}
              style={{ 
                width: '100%',
                padding: '8px',
                fontSize: 14,
                border: '1px solid #ddd',
                borderRadius: 4
              }}
            />
          </div>
        </div>
      </div>

      {parseError && (
        <div style={{ 
          backgroundColor: '#ffebee', 
          padding: 15, 
          marginTop: 10, 
          color: '#c62828', 
          borderRadius: 5,
          marginBottom: 20 
        }}>
          <strong>Error:</strong> {parseError}
        </div>
      )}

      {preview && (
        <>
          <div style={{
            backgroundColor: "#f5f5f5",
            padding: 20,
            marginTop: 20,
            borderRadius: 8,
            border: "1px solid #ddd"
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 15
            }}>
              <h4 style={{ margin: 0 }}>Preview - {selectedChartType.charAt(0).toUpperCase() + selectedChartType.slice(1)} Data</h4>
              <div style={{ 
                padding: '8px 16px', 
                backgroundColor: '#e3f2fd', 
                borderRadius: 4,
                fontSize: 14,
                fontWeight: 600,
                color: '#1976d2'
              }}>
                {preview.length} rows
              </div>
            </div>

            <div style={{ 
              maxHeight: 350, 
              overflowY: 'auto',
              backgroundColor: '#fff',
              borderRadius: 4
            }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  {selectedChartType === "geographic" ? (
                    <>
                      <th style={{ padding: 8, border: '1px solid #ddd' }}>Year</th>
                      <th style={{ padding: 8, border: '1px solid #ddd' }}>Country</th>
                      <th style={{ padding: 8, border: '1px solid #ddd' }}>Count</th>
                    </>
                  ) : selectedChartType === "age" ? (
                    <>
                      <th style={{ padding: 8, border: '1px solid #ddd' }}>Year</th>
                      <th style={{ padding: 8, border: '1px solid #ddd' }}>Age Group</th>
                      <th style={{ padding: 8, border: '1px solid #ddd' }}>Count</th>
                    </>
                  ) : selectedChartType === "occupation" ? (
                    <>
                      <th style={{ padding: 8, border: '1px solid #ddd' }}>Year</th>
                      <th style={{ padding: 8, border: '1px solid #ddd' }}>Occupation</th>
                      <th style={{ padding: 8, border: '1px solid #ddd' }}>Total Occ.</th>
                      <th style={{ padding: 8, border: '1px solid #ddd' }}>Total Edu.</th>
                      <th style={{ padding: 8, border: '1px solid #ddd' }}>Elem</th>
                      <th style={{ padding: 8, border: '1px solid #ddd' }}>HS</th>
                      <th style={{ padding: 8, border: '1px solid #ddd' }}>College</th>
                      <th style={{ padding: 8, border: '1px solid #ddd' }}>PG</th>
                    </>
                  ) : (
                    <>
                      <th style={{ padding: 8, border: '1px solid #ddd' }}>Year</th>
                      {selectedChartType === "gender" ? (
                        <>
                          <th style={{ padding: 8, border: '1px solid #ddd' }}>Male</th>
                          <th style={{ padding: 8, border: '1px solid #ddd' }}>Female</th>
                        </>
                      ) : selectedChartType === "total" ? (
                        <th style={{ padding: 8, border: '1px solid #ddd' }}>Total</th>
                      ) : (
                        <>
                          <th style={{ padding: 8, border: '1px solid #ddd' }}>Elementary</th>
                          <th style={{ padding: 8, border: '1px solid #ddd' }}>High School</th>
                          <th style={{ padding: 8, border: '1px solid #ddd' }}>College</th>
                          <th style={{ padding: 8, border: '1px solid #ddd' }}>Postgraduate</th>
                        </>
                      )}
                    </>
                  )}
                </tr>
              </thead>

              <tbody>
                {preview.slice(0, 10).map((row, i) => (
                  <tr key={i}>
                    {selectedChartType === "geographic" ? (
                      <>
                        <td style={{ padding: 8, border: '1px solid #ddd' }}>{row.year}</td>
                        <td style={{ padding: 8, border: '1px solid #ddd' }}>{row.country}</td>
                        <td style={{ padding: 8, border: '1px solid #ddd' }}>{row.count.toLocaleString()}</td>
                      </>
                    ) : selectedChartType === "age" ? (
                      <>
                        <td style={{ padding: 8, border: '1px solid #ddd' }}>{row.year}</td>
                        <td style={{ padding: 8, border: '1px solid #ddd' }}>{row.ageGroup}</td>
                        <td style={{ padding: 8, border: '1px solid #ddd' }}>{row.count.toLocaleString()}</td>
                      </>
                    ) : selectedChartType === "occupation" ? (
                      <>
                        <td style={{ padding: 8, border: '1px solid #ddd' }}>{row.year}</td>
                        <td style={{ padding: 8, border: '1px solid #ddd' }}>{row.occupation}</td>
                        <td style={{ padding: 8, border: '1px solid #ddd' }}>{row.totalOccupation.toLocaleString()}</td>
                        <td style={{ padding: 8, border: '1px solid #ddd' }}>{row.totalEducation.toLocaleString()}</td>
                        <td style={{ padding: 8, border: '1px solid #ddd' }}>{row.elementary.toLocaleString()}</td>
                        <td style={{ padding: 8, border: '1px solid #ddd' }}>{row.highSchool.toLocaleString()}</td>
                        <td style={{ padding: 8, border: '1px solid #ddd' }}>{row.college.toLocaleString()}</td>
                        <td style={{ padding: 8, border: '1px solid #ddd' }}>{row.postgraduate.toLocaleString()}</td>
                      </>
                    ) : (
                      <>
                        <td style={{ padding: 8, border: '1px solid #ddd' }}>{row.year}</td>
                        {selectedChartType === "gender" ? (
                          <>
                            <td style={{ padding: 8, border: '1px solid #ddd' }}>{row.male.toLocaleString()}</td>
                            <td style={{ padding: 8, border: '1px solid #ddd' }}>{row.female.toLocaleString()}</td>
                          </>
                        ) : selectedChartType === "total" ? (
                          <td style={{ padding: 8, border: '1px solid #ddd' }}>{row.total.toLocaleString()}</td>
                        ) : (
                          <>
                            <td style={{ padding: 8, border: '1px solid #ddd' }}>{row.elementary.toLocaleString()}</td>
                            <td style={{ padding: 8, border: '1px solid #ddd' }}>{row.highSchool.toLocaleString()}</td>
                            <td style={{ padding: 8, border: '1px solid #ddd' }}>{row.college.toLocaleString()}</td>
                            <td style={{ padding: 8, border: '1px solid #ddd' }}>{row.postgraduate.toLocaleString()}</td>
                          </>
                        )}
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            </div>

            <div style={{ 
              marginTop: 20, 
              display: 'flex', 
              gap: 10,
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={handleCancel}
                style={{ 
                  padding: '10px 24px', 
                  background: "#f5f5f5", 
                  color: "#333", 
                  border: "1px solid #ddd", 
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 500
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmUpload}
                style={{ 
                  padding: '10px 24px', 
                  background: "#1976d2", 
                  color: "#fff", 
                  border: "none", 
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 14
                }}
              >
                Add Chart to Dashboard
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CSVUpload;