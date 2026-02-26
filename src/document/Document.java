package document;

import node.Node;
import node.visitor.Transcluder;

public abstract class Document {
	
	private Node topNode;
	private Node currentNode;
	
	void setTopNode(Node n) {
		this.topNode = n;
		this.currentNode = n;
	}
	
	public void setCurrentNode(Node node) {
		this.currentNode = node;
	}
	
	public Node topNode() {
		return topNode;
	}
	
	public abstract void write(String s);
	
	public abstract void draw();


	Node getCurrentNode() {
		return currentNode;
	}
	
	public void transclude(Node n) {
		Node newNode = n.accept(Transcluder.get());
		currentNode.addChild(newNode);
		this.currentNode = newNode;
	}

}
