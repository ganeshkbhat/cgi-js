<!-- 
  License: MIT
  Dynamic CGI serving using dynamic path imports for 
         CGI supporting executable for Interpreted languages Embedded Distribution
  Contribution: 2018 Ganesh K. Bhat <ganeshsurfs@gmail.com>  
-->

<?php
  header('Content-Type: application/json');
  echo json_encode(array('$_SERVER' => $_SERVER));
?>