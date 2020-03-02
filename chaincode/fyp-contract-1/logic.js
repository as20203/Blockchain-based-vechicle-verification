'use strict';

const { Contract } = require('fabric-contract-api');

class testContract extends Contract {

    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');
        const vehicles = [
        {   
          purchaserName: "Hamza Iqbal",
          fatherNamePurchaser: "Shaukat Iqbal",
          cnicPurchaser: "35202-6495066-7",
          dateOfReg: "22-02-2019",
          transferredTo: "",
          fatherNameOwner: "",
          cnicOwner: "",
          dateOfTransfer: "",
          presentAddress: "Block-32, Allama Iqbal Town, Lahore",
          chassisNumber: "H82W-1400444",
          engineNumber: "3G83250094",
          numberOfCylinders: "3",
          typeOfBody: "Motor Car",
          maker: "Honda",
          makeName: "Corolla",
          classOfVehicle: "LTV",
          yearOfMfg: "2012",
          seatingCapacity: "4",
          horsePowerOrCC: "1400",
          transactionType:'CREATE',
          statusOfVehicle:'unissued',
          licenseNumber:'APPLIED FOR',
          currentOwnerCNIC:'35202-6495066-7',
          authorizer :''
        }
        ];

        for (let i = 0; i < vehicles.length; i++) {
            const vehicleAsBytes = await ctx.stub.getState(vehicles[i].chassisNumber);
            if (!vehicleAsBytes || vehicleAsBytes.length === 0) {
                vehicles[i].docType = 'vehicle';
                await ctx.stub.putState(vehicles[i].chassisNumber, Buffer.from(JSON.stringify(vehicles[i])));
                console.info('Added <--> ', vehicles[i]);
            }  
           
        }
        console.info('============= END : Initialize Ledger ===========');
    }

    

    async createVehicle(ctx, purchaserName, fatherNamePurchaser, cnicPurchaser, dateOfReg ,presentAddress,
        chassisNumber,engineNumber,numberOfCylinders,typeOfBody,maker,makeName,classOfVehicle,
        yearOfMfg,seatingCapacity,horsePowerOrCC,authorizer) {
        console.info('============= START : Create Vehicle ===========');

        const vehicleAsBytes = await ctx.stub.getState(chassisNumber); // get the car from chaincode state
        console.log(vehicleAsBytes.toString());

        if (!vehicleAsBytes || vehicleAsBytes.length === 0) {
            const vehicle = {
                purchaserName,
                fatherNamePurchaser,
                cnicPurchaser,
                dateOfReg,
                transferredTo:"",
                fatherNameOwner:"",
                cnicOwner:"",
                dateOfTransfer:"",
                presentAddress,
                chassisNumber,
                engineNumber,
                numberOfCylinders,
                typeOfBody,
                maker,
                makeName,
                classOfVehicle,
                yearOfMfg,
                seatingCapacity,
                horsePowerOrCC,
                transactionType:"CREATE",
                docType:"vehicle",
                statusOfVehicle:"unissued",
                licenseNumber:"APPLIED FOR",
                currentOwnerCNIC:cnicPurchaser,
                authorizer:authorizer
            };

        await ctx.stub.putState(chassisNumber, Buffer.from(JSON.stringify(vehicle)));
        console.info('============= END : Create Car ===========');
            
        }else{
            throw new Error(`${chassisNumber} already exists`);
        }

       
    }
    
    //Query Vehicles
    async queryVehicle(ctx, vehicleNumber) {
        const vehicleAsBytes = await ctx.stub.getState(vehicleNumber); // get the car from chaincode state
        if (!vehicleAsBytes || vehicleAsBytes.length === 0) {
            throw new Error(`${vehicleNumber} does not exist`);
        }
        console.log(vehicleAsBytes.toString());
        return vehicleAsBytes.toString();
    }

    async queryAllVehicles(ctx) {
        const startKey = '';
        const endKey = '';
        const iterator = await ctx.stub.getStateByRange(startKey, endKey);

        const allResults = [];
        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                console.log(res.value.value.toString('utf8'));
                const Key = res.value.key;
                let Record;
                try {
                    Record = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    Record = res.value.value.toString('utf8');
                }
                allResults.push({ Key, Record });
            }
            if (res.done) {
                console.log('end of data');
                await iterator.close();
                console.info(allResults);
                return JSON.stringify(allResults);
            }
        }
    }


    async  queryVehicleByString(ctx, query) {
        let iterator = await ctx.stub.getQueryResult(query);
        const allResults = [];
        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                console.log(res.value.value.toString('utf8'));

                const Key = res.value.key;
                let Record;
                try {
                    Record = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    Record = res.value.value.toString('utf8');
                }
                allResults.push({ Key, Record });
            }
            if (res.done) {
                console.log('end of data');
                await iterator.close();
                console.info(allResults);
                return JSON.stringify(allResults);
            }
        }
        
    }


    //Delete A Car
    async deleteVehicle(ctx,vehicleNumber,authorizer) {
        const vehicleAsBytes = await ctx.stub.getState(vehicleNumber); // get the car from chaincode state
        if (!vehicleAsBytes || vehicleAsBytes.length === 0) {
            throw new Error(`${vehicleAsBytes} does not exist`);
        }else{
            const vehicle = JSON.parse(vehicleAsBytes.toString());
            vehicle.authorizer   = authorizer;
            vehicle.transactionType='DELETE';
            vehicle.statusOfVehicle='unissued';

            await ctx.stub.putState(vehicleNumber, Buffer.from(JSON.stringify(vehicle)));
            await ctx.stub.deleteState(vehicleNumber); 
            console.log('Car deleted from the ledger Succesfully..');
        }
    }


    //Transfer Vehicle
    async transferVehicle(ctx, vehicleNumber,  transferredTo, fatherNameOwner, cnicOwner, dateOfTransfer,presentAddress,authorizer) {
        console.info('============= START : Transfer Vehicle ===========');
        const vehicleAsBytes = await ctx.stub.getState(vehicleNumber); // get the car from chaincode state
        if (!vehicleAsBytes || vehicleAsBytes.length === 0) {
            throw new Error(`${vehicleAsBytes} does not exist`);
        }
        const vehicle = JSON.parse(vehicleAsBytes.toString());

        if(vehicle.transactionType==='CREATE' && vehicle.statusOfVehicle==='issued' && vehicle.licenseNumber!=='APPLIED FOR'){
            vehicle.transferredTo = transferredTo;
            vehicle.fatherNameOwner = fatherNameOwner;
            vehicle.cnicOwner = cnicOwner;
            vehicle.dateOfTransfer = dateOfTransfer;
            vehicle.presentAddress = presentAddress
            vehicle.statusOfVehicle ="unissued";
            vehicle.transactionType="TRANSFER";
            vehicle.currentOwnerCNIC=cnicOwner;
            vehicle.authorizer   = authorizer;
            await ctx.stub.putState(vehicleNumber, Buffer.from(JSON.stringify(vehicle)));

        }else{
             throw new Error("Vehicle is not registered and issued");
        }

        console.info('============= END : Transfer Vehicle ===========');
    }

    //GENERATE LICENSE
    async generateLicense(ctx,vehicleNumber,licenseNumber,authorizer){
        console.info('============= START : Verification by NADRA ===========');
        const vehicleAsBytes = await ctx.stub.getState(vehicleNumber); // get the car from chaincode state
        if (!vehicleAsBytes || vehicleAsBytes.length === 0) {
            throw new Error(`${vehicleAsBytes} does not exist`);
        }
        const vehicle = JSON.parse(vehicleAsBytes.toString());

        if(vehicle.statusOfVehicle==="issued" || vehicle.transactionType==='TRANSFER'){
            vehicle.licenseNumber=licenseNumber
            vehicle.authorizer   = authorizer
            await ctx.stub.putState(vehicleNumber, Buffer.from(JSON.stringify(vehicle)));
        }else{
            throw new Error("vehicle is not issued Can't give licenseNumber.");
        }
        console.info('============= END : Verified by NADRA ===========');

    }


    //VEHICLE VERIFICATION.
    async nadraVerification(ctx,vehicleNumber,authorizer){
        console.info('============= START : Verification by NADRA ===========');
        const vehicleAsBytes = await ctx.stub.getState(vehicleNumber); // get the car from chaincode state
        if (!vehicleAsBytes || vehicleAsBytes.length === 0) {
            throw new Error(`${vehicleAsBytes} does not exist`);
        }
        const vehicle = JSON.parse(vehicleAsBytes.toString());

        if(vehicle.statusOfVehicle==="unissued"){
            vehicle.statusOfVehicle ="verified by NADRA";
            vehicle.authorizer   = authorizer;
            await ctx.stub.putState(vehicleNumber, Buffer.from(JSON.stringify(vehicle)));
        }else{
            throw new Error("vehicle is not issued ");
        }
        console.info('============= END : Verified by NADRA ===========');
       
    }

    async exciseVerification(ctx,vehicleNumber,authorizer){
        console.info('============= START : Verification by Excise Department ===========');
        const vehicleAsBytes = await ctx.stub.getState(vehicleNumber); // get the car from chaincode state
        if (!vehicleAsBytes || vehicleAsBytes.length === 0) {
            throw new Error(`${vehicleAsBytes} does not exist`);
        }

        const vehicle = JSON.parse(vehicleAsBytes.toString());
        if(vehicle.statusOfVehicle==="verified by NADRA"){
            vehicle.statusOfVehicle ="issued";
            vehicle.authorizer = authorizer
            await ctx.stub.putState(vehicleNumber, Buffer.from(JSON.stringify(vehicle)));
        }else{
            throw new Error("vehicle is not issued by NADRA. ");
        }
        console.info('============= END : Verified by Excise Department ===========');
    }


    
    //Get Vehicle history
    async retrieveHistoryForVehicle(ctx, key) {
        console.info('getting history for key: ' + key);
        let iterator = await ctx.stub.getHistoryForKey(key);
        let result = [];
        let res = await iterator.next();
        while (!res.done) {
        if (res.value) {
            let jsonRes = {};
            jsonRes.TxId = res.value.tx_id;
            jsonRes.Timestamp = res.value.timestamp;
            jsonRes.IsDelete = res.value.is_delete.toString();
            try {
                jsonRes.Value = JSON.parse(res.value.value.toString('utf8'));
            } 
            catch (err) {
                console.log(err);
                jsonRes.Value = res.value.value.toString('utf8');
            }
            console.info(`found state update with value: ${res.value.value.toString('utf8')}`);
            result.push(jsonRes);
        }
        res = await iterator.next();
        }
        await iterator.close();
        return result;
  }


 }

module.exports = testContract;
