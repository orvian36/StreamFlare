const {spawnAsync} =require('child_process');


var outputData="";
    const pythonProcess = spawn('python', [pythonScriptPath, inputData]);
    await pythonProcess.stdout.on('data', (data) => {
        const outputData = data.toString();
        console.log('Python Script Output:', outputData);
        console.log(typeof(outputData));
        // Handle the output as needed
        
    });

    await pythonProcess.stderr.on('data', (data) => {
        console.error('Error:', data.toString());
    });

    await pythonProcess.on('close', (code) => {
        if (code === 0) {
            console.log('Python script executed successfully');
            res.status(200).json(outputData);
            
        } else {
            console.error('Python script execution failed with code:', code);
            res.status(500).json({ error: 'internel error' });
        }
    });