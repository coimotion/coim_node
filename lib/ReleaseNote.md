Bux fixed
=========
0805
----
+ 參數值為中文時會出錯  
+ Cannot pass parameters with Chinese value  
  
> 使用string.length計算資料長度遇到中文會有出錯，改用buffer(param).length即可解決。  
> Content-Length for sent body with Chinese using string.length cannot fit data with Chinese words. Now use buffer(string).length to get Content-Length.  
  
+ tag參數只接受JSON Array的字串，傳入陣列時API會失敗  
+ parameter "tag" takes string-represented JSON Array, and do note deal with value as JS array object  
  
> 檢查傳入的參數是否為陣列，是的話轉成字串取代原來的值。  
> Check if parameters' value is array, and convert array to string for replacing value of the paramter.  
  
+ attach方法無法上傳外部網址做為附件  
+ attach method cannot take parameter "dataURI" with external URL as attach file  
  
> 目前修改為，傳入的files陣列為空時，會進一步檢查參數中是否有"dataURI"，有的話改用send方法發送API。  
> If "files" (array of paths to upload) is empty, the method will check parameters for "dataURI". If it exists in parameters, API will be call by using send method.
